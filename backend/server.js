const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu',        require('./routes/menu'));
app.use('/api/cart',        require('./routes/cart'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/group-orders',require('./routes/groupOrders'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/delivery',    require('./routes/delivery'));
app.use('/api/payment',     require('./routes/payment'));
app.use('/api/analytics',   require('./routes/analytics'));

// Health check
app.get('/', (req, res) => res.json({ message: 'QickServe API running' }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
