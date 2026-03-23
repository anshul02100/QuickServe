const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cuisine:     { type: String, required: true },   // e.g. "Indian", "Chinese"
    image:       { type: String, default: '' },       // URL or path
    address:     { type: String, required: true },
    rating:      { type: Number, default: 4.0, min: 0, max: 5 },
    deliveryTime:{ type: Number, default: 30 },       // in minutes
    minOrder:    { type: Number, default: 0 },
    isOpen:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
