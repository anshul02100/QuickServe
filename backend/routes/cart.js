const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// We store cart in a simple in-memory approach per user using a Cart model
// For simplicity, we embed it in User or use a Cart collection
const cartSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name:     String,
      price:    Number,
      quantity: { type: Number, default: 1 },
      image:    String,
    },
  ],
});
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// GET /api/cart  — get current user's cart
router.get('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('restaurant', 'name');
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart/add  — add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        user: req.user._id,
        restaurant: menuItem.restaurant,
        items: [],
      });
    } else if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant.toString()) {
      // Different restaurant — clear cart first
      cart.restaurant = menuItem.restaurant;
      cart.items = [];
    }

    // Check if item already in cart
    const existingIdx = cart.items.findIndex(
      (i) => i.menuItem.toString() === menuItemId
    );
    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({
        menuItem: menuItem._id,
        name:     menuItem.name,
        price:    menuItem.price,
        quantity,
        image:    menuItem.image,
      });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cart/item/:menuItemId  — update quantity
router.put('/item/:menuItemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const idx = cart.items.findIndex(
      (i) => i.menuItem.toString() === req.params.menuItemId
    );
    if (idx === -1) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart  — clear cart
router.delete('/', protect, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
