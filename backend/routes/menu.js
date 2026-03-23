const express  = require('express');
const router   = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/menu/:restaurantId  — get all items for a restaurant
router.get('/:restaurantId', async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.restaurantId, isAvailable: true });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/menu/item/:id/combo  — Unique Feature: Combo Suggestion
// Returns a suggested drink + side to pair with a main dish
router.get('/item/:id/combo', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find a drink and a side from the same restaurant
    const [drink, side] = await Promise.all([
      MenuItem.findOne({
        restaurant: item.restaurant,
        tags: 'drink',
        isAvailable: true,
        _id: { $ne: item._id },
      }),
      MenuItem.findOne({
        restaurant: item.restaurant,
        tags: 'side',
        isAvailable: true,
        _id: { $ne: item._id },
      }),
    ]);

    const suggestions = [];
    if (drink) suggestions.push(drink);
    if (side)  suggestions.push(side);

    res.json({ item, suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/menu  — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const menuItem = await MenuItem.create(req.body);
    res.status(201).json(menuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/menu/:id  — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/menu/:id  — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
