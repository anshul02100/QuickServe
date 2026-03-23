const express    = require('express');
const router     = express.Router();
const GroupOrder = require('../models/GroupOrder');
const { protect } = require('../middleware/auth');

// Generate a short random share code
const makeCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/group-orders  — create a group order session
router.post('/', protect, async (req, res) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) return res.status(400).json({ message: 'Restaurant ID required' });

    const shareCode = makeCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    const groupOrder = await GroupOrder.create({
      createdBy:   req.user._id,
      restaurant:  restaurantId,
      shareCode,
      participants:[{ user: req.user._id, name: req.user.name, items: [] }],
      expiresAt,
    });

    res.status(201).json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/group-orders/:code  — join/view a group order by share code
router.get('/:code', async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({ shareCode: req.params.code.toUpperCase() })
      .populate('restaurant', 'name image cuisine')
      .populate('participants.user', 'name');
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.status !== 'open') return res.status(400).json({ message: 'Group order is closed' });
    res.json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/group-orders/:code/join  — add a participant's items
router.post('/:code/join', protect, async (req, res) => {
  try {
    const { items } = req.body; // [{ menuItem, name, price, quantity }]
    const groupOrder = await GroupOrder.findOne({ shareCode: req.params.code.toUpperCase() });
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.status !== 'open') return res.status(400).json({ message: 'Group order is closed' });

    // Check if user already a participant
    const existing = groupOrder.participants.find(
      (p) => p.user && p.user.toString() === req.user._id.toString()
    );
    if (existing) {
      existing.items = items; // Update their items
    } else {
      groupOrder.participants.push({ user: req.user._id, name: req.user.name, items });
    }

    await groupOrder.save();
    res.json(groupOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/group-orders/:code/place  — creator places the combined order
router.post('/:code/place', protect, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    const groupOrder = await GroupOrder.findOne({ shareCode: req.params.code.toUpperCase() });
    if (!groupOrder) return res.status(404).json({ message: 'Group order not found' });
    if (groupOrder.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the creator can place the order' });

    // Combine all participants' items
    const allItems = groupOrder.participants.flatMap((p) => p.items);
    if (allItems.length === 0) return res.status(400).json({ message: 'No items in group order' });

    const totalAmount = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const Order = require('../models/Order');
    const order = await Order.create({
      user:        req.user._id,
      restaurant:  groupOrder.restaurant,
      items:       allItems,
      totalAmount,
      deliveryAddress,
      groupOrderId: groupOrder._id,
    });

    groupOrder.status = 'placed';
    await groupOrder.save();

    res.status(201).json({ order, groupOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
