const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     {
      type: String, required: [true, 'Name is required'], trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email:    {
      type: String, required: [true, 'Email is required'], unique: true,
      lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String, required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'restaurant_admin', 'delivery_partner', 'user', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
    },
    phone:   {
      type: String, default: '',
      match: [/^(\+?\d{7,15})?$/, 'Please enter a valid phone number'],
    },
    address: { type: String, default: '', maxlength: [200, 'Address too long'] },

    // Delivery-partner specific fields
    isAvailable: { type: Boolean, default: true },
    vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car', ''], default: '' },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
