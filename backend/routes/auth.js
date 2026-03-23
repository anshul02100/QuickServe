const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please fill all required fields' });

    const allowedRoles = ['customer', 'restaurant_admin', 'delivery_partner'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: userRole });
    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Normalise legacy roles
    const roleMap = { user: 'customer', admin: 'restaurant_admin' };
    const actualRole = roleMap[user.role] || user.role;

    if (expectedRole && expectedRole !== actualRole) {
      return res.status(403).json({ message: `This account is registered as a ${actualRole.replace('_', ' ')}. Please select the correct role.` });
    }

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  actualRole,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me  — get current user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me  — update profile
router.put('/me', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
