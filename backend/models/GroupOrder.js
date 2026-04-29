const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  items:   [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name:     { type: String, required: true },
    price:    { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  }],
  subtotal:{ type: Number, default: 0, min: 0 },
}, { _id: false });

const groupOrderSchema = new mongoose.Schema(
  {
    restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: [true, 'Restaurant required'] },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: [true, 'Creator required'] },
    inviteCode:  {
      type: String, required: true, unique: true,
      minlength: [6, 'Invite code too short'], maxlength: [20, 'Invite code too long'],
    },
    status: {
      type: String,
      enum: { values: ['open', 'locked', 'placed', 'cancelled'], message: 'Invalid group order status' },
      default: 'open',
    },
    participants: [participantSchema],
    totalAmount:  { type: Number, default: 0, min: 0 },
    deliveryAddress: { type: String, default: '', maxlength: 300 },
    expiresAt:    { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) }, // 30 min TTL
  },
  { timestamps: true }
);

groupOrderSchema.index({ inviteCode: 1 }, { unique: true });
groupOrderSchema.index({ createdBy: 1 });
groupOrderSchema.index({ status: 1 });
groupOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — auto-delete expired

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
