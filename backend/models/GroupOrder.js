const mongoose = require('mongoose');

// Each participant adds their own items to a shared group order
const participantSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:  { type: String, required: true },   // allows guest names too
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name:     String,
      price:    Number,
      quantity: { type: Number, default: 1 },
    },
  ],
});

const groupOrderSchema = new mongoose.Schema(
  {
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    shareCode:  { type: String, required: true, unique: true }, // short unique code e.g. "ABC123"
    participants:[participantSchema],
    status:     { type: String, enum: ['open', 'placed', 'cancelled'], default: 'open' },
    expiresAt:  { type: Date },   // optional expiry
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
