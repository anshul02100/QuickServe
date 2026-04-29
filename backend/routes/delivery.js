const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect, deliveryOnly } = require('../middleware/auth');

router.use(protect, deliveryOnly);

// GET /api/delivery/orders — all orders assigned to this delivery partner
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('user', 'name phone')
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/delivery/available — orders ready to be picked up (out_for_delivery, no partner assigned)
router.get('/available', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['confirmed', 'preparing'] },
      deliveryPartner: { $exists: false },
    })
      .populate('user', 'name phone')
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/delivery/accept/:orderId — delivery partner self-assigns
router.post('/accept/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.deliveryPartner) return res.status(400).json({ message: 'Already assigned' });

    order.deliveryPartner = req.user._id;
    order.status = 'out_for_delivery';
    await order.save();
    await order.populate('user', 'name phone');
    await order.populate('restaurant', 'name address');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/delivery/orders/:orderId/status
router.put('/orders/:orderId/status', async (req, res) => {
  const ALLOWED = ['out_for_delivery', 'delivered'];
  try {
    const { status } = req.body;
    if (!ALLOWED.includes(status))
      return res.status(400).json({ message: 'Invalid status transition' });

    const order = await Order.findOne({ _id: req.params.orderId, deliveryPartner: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/delivery/stats — earnings + delivery count
router.get('/stats', async (req, res) => {
  try {
    const delivered = await Order.find({ deliveryPartner: req.user._id, status: 'delivered' });
    const active    = await Order.find({ deliveryPartner: req.user._id, status: { $ne: 'delivered' } });
    const earnings  = delivered.reduce((s, o) => s + (o.totalAmount * 0.1), 0); // 10% earnings
    res.json({ deliveredCount: delivered.length, activeCount: active.length, earnings: Math.round(earnings) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
