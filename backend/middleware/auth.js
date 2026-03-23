const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect route — requires valid JWT
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// Restaurant admin only (supports both old 'admin' and new 'restaurant_admin')
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'restaurant_admin' || req.user.role === 'admin')) return next();
  res.status(403).json({ message: 'Restaurant admin access only' });
};

// Delivery partner only
const deliveryOnly = (req, res, next) => {
  if (req.user && req.user.role === 'delivery_partner') return next();
  res.status(403).json({ message: 'Delivery partner access only' });
};

module.exports = { protect, adminOnly, deliveryOnly };
