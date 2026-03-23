const express    = require('express');
const router     = express.Router();
const Restaurant = require('../models/Restaurant');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/restaurants  — list all (with optional search/filter)
router.get('/', async (req, res) => {
  try {
    const { search, cuisine } = req.query;
    const filter = {};
    if (search)  filter.name    = { $regex: search, $options: 'i' };
    if (cuisine) filter.cuisine = { $regex: cuisine, $options: 'i' };

    const restaurants = await Restaurant.find(filter).sort({ rating: -1 });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/restaurants  — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/restaurants/:id  — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/restaurants/:id  — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
