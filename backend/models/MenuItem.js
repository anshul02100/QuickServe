const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: [true, 'Restaurant reference required'] },
    name:    { type: String, required: [true, 'Item name required'], trim: true, maxlength: [80, 'Name too long'] },
    description: { type: String, default: '', maxlength: [300, 'Description too long'] },
    price:   { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    category:{ type: String, default: 'Main', maxlength: [40, 'Category too long'] },
    image:   { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isVeg:   { type: Boolean, default: false },
    tags:    [{ type: String, maxlength: 30 }],
    calories:{ type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
