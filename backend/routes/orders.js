const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');
router.post('/', protect, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, groupOrderId } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'No items in order' });
    if (!deliveryAddress)
      return res.status(400).json({ message: 'Delivery address required' });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      user:       req.user._id,
      restaurant: restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cash',
      groupOrderId:  groupOrderId || null,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name address image')
      .populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
