const express    = require('express');
const router     = express.Router();
const GroupOrder = require('../models/GroupOrder');
const Order      = require('../models/Order');
const { protect } = require('../middleware/auth');

const makeCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create a new group order
router.post('/', protect, async (req, res) => {
  try {
    const { restaurantId, deliveryAddress } = req.body;
    if (!restaurantId) return res.status(400).json({ message: 'Restaurant ID required' });

    const inviteCode = makeCode();

    const groupOrder = await GroupOrder.create({
      createdBy:   req.user._id,
      restaurant:  restaurantId,
      inviteCode,
      participants:[{ user: req.user._id, name: req.user.name, items: [], subtotal: 0 }],
      deliveryAddress: deliveryAddress || '',
    });

    res.status(201).json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get group order by invite code
router.get('/:code', async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.code.toUpperCase() })
      .populate('restaurant', 'name image cuisine address')
      .populate('participants.user', 'name');
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.status !== 'open') return res.status(400).json({ message: `Group order is ${groupOrder.status}` });
    res.json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join / update items in a group order
router.post('/:code/join', protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'Add at least one item' });

    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.status !== 'open') return res.status(400).json({ message: 'Group order is closed' });
    if (groupOrder.expiresAt < new Date()) {
      groupOrder.status = 'cancelled';
      await groupOrder.save();
      return res.status(400).json({ message: 'Group order has expired' });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const existing = groupOrder.participants.find(p => p.user?.toString() === req.user._id.toString());
    if (existing) {
      existing.items    = items;
      existing.subtotal = subtotal;
    } else {
      groupOrder.participants.push({ user: req.user._id, name: req.user.name, items, subtotal });
    }

    groupOrder.totalAmount = groupOrder.participants.reduce((s, p) => s + (p.subtotal || 0), 0);
    await groupOrder.save();
    res.json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Creator locks & places group order
router.post('/:code/place', protect, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the creator can place the order' });

    const allItems = groupOrder.participants.flatMap(p => p.items);
    if (allItems.length === 0) return res.status(400).json({ message: 'No items added yet' });

    const totalAmount = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const addr = deliveryAddress || groupOrder.deliveryAddress;
    if (!addr) return res.status(400).json({ message: 'Delivery address is required' });

    const order = await Order.create({
      user:        req.user._id,
      restaurant:  groupOrder.restaurant,
      items:       allItems,
      totalAmount,
      deliveryAddress: addr,
      groupOrderId: groupOrder._id,
    });

    groupOrder.status = 'placed';
    await groupOrder.save();
    res.status(201).json({ order, groupOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Creator cancels a group order
router.post('/:code/cancel', protect, async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!groupOrder) return res.status(404).json({ message: 'Not found' });
    if (groupOrder.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the creator can cancel' });
    groupOrder.status = 'cancelled';
    await groupOrder.save();
    res.json({ message: 'Group order cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
