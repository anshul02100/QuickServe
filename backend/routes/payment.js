const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

// Simulate Razorpay order creation
// In production, replace with: const Razorpay = require('razorpay')
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, orderId } = req.body; // amount in paise (INR * 100)

    // Simulated Razorpay order response
    // In production: use razorpay.orders.create({ amount, currency: 'INR', receipt: orderId })
    const razorpayOrder = {
      id: 'order_' + crypto.randomBytes(8).toString('hex'),
      entity: 'order',
      amount: amount * 100,
      currency: 'INR',
      status: 'created',
      receipt: orderId,
    };

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify payment and update order status
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Signature verification
    // In production: use RAZORPAY_KEY_SECRET from env
    const secret = process.env.RAZORPAY_KEY_SECRET || 'razorpay_test_secret';
    const generated = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // For demo mode: accept if signature matches OR if it's a test payment
    const isValid = generated === razorpaySignature || razorpayPaymentId.startsWith('pay_demo');

    if (!isValid) return res.status(400).json({ message: 'Payment verification failed' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus   = 'paid';
    order.paymentId       = razorpayPaymentId;
    order.paymentMethod   = 'online';
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
