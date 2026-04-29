const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign a delivery partner to an order
router.put('/orders/:id/assign', async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryPartner: deliveryPartnerId, status: 'out_for_delivery' },
      { new: true }
    ).populate('deliveryPartner', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all delivery partners
router.get('/delivery-partners', async (req, res) => {
  try {
    const partners = await User.find({ role: 'delivery_partner' }).select('-password');
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalOrders, totalUsers, revenue] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    res.json({
      totalOrders,
      totalUsers,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly revenue chart data (last 6 months)
router.get('/stats/chart', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [revenueByMonth, ordersByMonth, ordersByStatus] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = revenueByMonth.map(r => ({
      month: MONTHS[r._id.month - 1],
      revenue: r.revenue,
      orders: r.count,
    }));

    res.json({ monthly: formatted, statusBreakdown: ordersByStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
