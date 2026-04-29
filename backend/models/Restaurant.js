const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name:    {
      type: String, required: [true, 'Restaurant name is required'], trim: true,
      minlength: [2, 'Name too short'], maxlength: [100, 'Name too long'],
    },
    cuisine: { type: String, default: '', maxlength: [50, 'Cuisine tag too long'] },
    address: { type: String, default: '', maxlength: [300, 'Address too long'] },
    image:   { type: String, default: '' },
    owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rating:  { type: Number, default: 0, min: [0, 'Rating min 0'], max: [5, 'Rating max 5'] },
    isOpen:  { type: Boolean, default: true },
    minOrder:{ type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    deliveryTime: { type: Number, default: 30, min: 5 }, // minutes
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', cuisine: 'text' });
restaurantSchema.index({ isOpen: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
