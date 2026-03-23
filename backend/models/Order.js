const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:      { type: String, required: true },   // snapshot at order time
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items:      [orderItemSchema],
    totalAmount:{ type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: { type: String, required: true },
    paymentMethod:   { type: String, enum: ['cash', 'online'], default: 'cash' },
    // Group order reference (optional)
    groupOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupOrder', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
