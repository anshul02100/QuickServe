const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: [true, 'Menu item reference required'] },
  name:     { type: String, required: [true, 'Item name required'], trim: true },
  price:    { type: Number, required: [true, 'Item price required'], min: [0, 'Price cannot be negative'] },
  quantity: { type: Number, required: [true, 'Quantity required'], min: [1, 'Quantity must be at least 1'], max: [20, 'Max quantity is 20'] },
});

const orderSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: [true, 'User is required'] },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: [true, 'Restaurant is required'] },
    items:      { type: [orderItemSchema], validate: [arr => arr.length > 0, 'Order must have at least one item'] },
    totalAmount:{ type: Number, required: [true, 'Total amount is required'], min: [0, 'Total cannot be negative'] },
    status: {
      type: String,
      enum: { values: ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'], message: 'Invalid status' },
      default: 'pending',
    },
    deliveryAddress: { type: String, required: [true, 'Delivery address is required'], maxlength: [300, 'Address too long'] },
    paymentMethod:   { type: String, enum: { values: ['cash','online'], message: 'Invalid payment method' }, default: 'cash' },
    paymentStatus:   { type: String, enum: { values: ['pending','paid','failed'], message: 'Invalid payment status' }, default: 'pending' },
    paymentId:       { type: String, default: null },

    groupOrderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'GroupOrder', default: null },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    estimatedDeliveryTime: { type: Number, default: 30, min: 5, max: 180 }, // minutes
    notes: { type: String, default: '', maxlength: [300, 'Notes too long'] },
  },
  { timestamps: true }
);

// Indexes for common query patterns
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ groupOrderId: 1 });

// Validate total matches items
orderSchema.pre('save', function(next) {
  const computed = this.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  if (Math.abs(computed - this.totalAmount) > 1) {
    return next(new Error(`totalAmount (${this.totalAmount}) does not match items sum (${computed.toFixed(2)})`));
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
