const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Overview KPIs ──────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalOrders, totalRevenue, totalCustomers, totalDeliveryPartners,
      monthOrders, monthRevenue,
      lastMonthOrders, lastMonthRevenue,
      pendingOrders, cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      User.countDocuments({ role: { $in: ['customer', 'user'] } }),
      User.countDocuments({ role: 'delivery_partner' }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

    const thisRev  = monthRevenue[0]?.total || 0;
    const lastRev  = lastMonthRevenue[0]?.total || 0;
    const revGrowth = lastRev ? (((thisRev - lastRev) / lastRev) * 100).toFixed(1) : null;
    const ordGrowth = lastMonthOrders ? (((monthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1) : null;

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCustomers,
      totalDeliveryPartners,
      monthOrders,
      monthRevenue: thisRev,
      pendingOrders,
      cancelledOrders,
      revenueGrowth: revGrowth,
      ordersGrowth: ordGrowth,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Revenue & orders over time (last N months) ─────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const since  = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1); since.setHours(0,0,0,0);

    const [revenueData, ordersData] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
    ]);

    // Build a complete month list so zeros are shown
    const result = [];
    const cur = new Date(since);
    while (cur <= new Date()) {
      const y = cur.getFullYear(), m = cur.getMonth() + 1;
      const rev = revenueData.find(r => r._id.y === y && r._id.m === m);
      const ord = ordersData.find(r => r._id.y === y && r._id.m === m);
      result.push({
        label: `${MONTHS[m-1]} ${y}`,
        month: MONTHS[m-1],
        year: y,
        revenue: rev?.revenue || 0,
        orders: ord?.count || 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Order status breakdown ─────────────────────────────────────────────────
router.get('/status-breakdown', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data.map(d => ({ status: d._id, count: d.count })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Top menu items by revenue ──────────────────────────────────────────────
router.get('/top-items', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, qty: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);
    res.json(data.map(d => ({ name: d._id, revenue: d.revenue, quantity: d.qty })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Payment method breakdown ───────────────────────────────────────────────
router.get('/payment-methods', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]);
    res.json(data.map(d => ({ method: d._id, count: d.count, revenue: d.revenue })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Average order value trend ──────────────────────────────────────────────
router.get('/aov', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const since  = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1); since.setHours(0,0,0,0);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, avg: { $avg: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);
    res.json(data.map(d => ({ label: `${MONTHS[d._id.m-1]}`, aov: Math.round(d.avg), orders: d.count })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Delivery partner performance ───────────────────────────────────────────
router.get('/delivery-performance', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { deliveryPartner: { $ne: null }, status: 'delivered' } },
      { $group: { _id: '$deliveryPartner', deliveries: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { deliveries: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'partner' } },
      { $unwind: '$partner' },
      { $project: { name: '$partner.name', email: '$partner.email', deliveries: 1, revenue: 1 } },
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
