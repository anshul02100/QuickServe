const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name:       { type: String, required: true, trim: true },
    description:{ type: String, default: '' },
    price:      { type: Number, required: true, min: 0 },
    category:   { type: String, required: true },  // e.g. "Starter", "Main Course", "Drink", "Dessert"
    image:      { type: String, default: '' },
    isVeg:      { type: Boolean, default: false },
    isAvailable:{ type: Boolean, default: true },
    // For Combo Suggestion feature: tags to help match combos
    tags:       [{ type: String }],  // e.g. ["main", "drink", "side"]
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
