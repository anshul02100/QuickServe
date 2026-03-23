const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User       = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem   = require('../models/MenuItem');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany();
  await Restaurant.deleteMany();
  await MenuItem.deleteMany();
  console.log('Cleared existing data');

  // Create users for all three roles
  await User.create({ name: 'Test Customer',      email: 'customer@quickserve.com',  password: 'user123',     role: 'customer' });
  await User.create({ name: 'Restaurant Admin',   email: 'admin@quickserve.com',     password: 'admin123',    role: 'restaurant_admin' });
  await User.create({ name: 'Delivery Partner',   email: 'delivery@quickserve.com',  password: 'delivery123', role: 'delivery_partner' });
  // Legacy aliases still work
  await User.create({ name: 'Legacy User',        email: 'user@foodapp.com',        password: 'user123',     role: 'customer' });
  await User.create({ name: 'Legacy Admin',       email: 'admin@foodapp.com',       password: 'admin123',    role: 'restaurant_admin' });
  console.log('Users created');

  const r1 = await Restaurant.create({
    name: 'Spice Garden', cuisine: 'Indian', description: 'Authentic North Indian flavors',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    address: '12, MG Road, Bangalore', rating: 4.5, deliveryTime: 35, minOrder: 150,
  });
  const r2 = await Restaurant.create({
    name: 'Dragon Wok', cuisine: 'Chinese', description: 'Classic Chinese & Indo-Chinese dishes',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
    address: '45, Koramangala, Bangalore', rating: 4.2, deliveryTime: 25, minOrder: 100,
  });
  const r3 = await Restaurant.create({
    name: 'Burger Barn', cuisine: 'Fast Food', description: 'Juicy burgers and crispy fries',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    address: '78, Indiranagar, Bangalore', rating: 4.0, deliveryTime: 20, minOrder: 80,
  });
  console.log('Restaurants created');

  await MenuItem.insertMany([
    { restaurant: r1._id, name: 'Butter Chicken',  category: 'Main Course', price: 280, isVeg: false, tags: ['main'],    description: 'Creamy tomato-based chicken curry',      image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300' },
    { restaurant: r1._id, name: 'Dal Makhani',     category: 'Main Course', price: 200, isVeg: true,  tags: ['main'],    description: 'Slow-cooked black lentils',               image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300' },
    { restaurant: r1._id, name: 'Garlic Naan',     category: 'Breads',      price: 60,  isVeg: true,  tags: ['side'],    description: 'Soft naan with garlic butter',            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300' },
    { restaurant: r1._id, name: 'Paneer Tikka',    category: 'Starter',     price: 220, isVeg: true,  tags: ['side'],    description: 'Grilled cottage cheese with spices',      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300' },
    { restaurant: r1._id, name: 'Mango Lassi',     category: 'Drinks',      price: 80,  isVeg: true,  tags: ['drink'],   description: 'Sweet mango yogurt drink',                image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300' },
    { restaurant: r1._id, name: 'Gulab Jamun',     category: 'Dessert',     price: 90,  isVeg: true,  tags: ['dessert'], description: 'Soft milk dumplings in sugar syrup',      image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8ad7?w=300' },
  ]);
  await MenuItem.insertMany([
    { restaurant: r2._id, name: 'Chicken Fried Rice', category: 'Main Course', price: 180, isVeg: false, tags: ['main'],  description: 'Wok-tossed rice with chicken and veggies', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300' },
    { restaurant: r2._id, name: 'Veg Noodles',        category: 'Main Course', price: 150, isVeg: true,  tags: ['main'],  description: 'Stir-fried noodles with vegetables',       image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300' },
    { restaurant: r2._id, name: 'Spring Rolls',       category: 'Starter',     price: 120, isVeg: true,  tags: ['side'],  description: 'Crispy rolls stuffed with veggies',        image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300' },
    { restaurant: r2._id, name: 'Lemon Iced Tea',     category: 'Drinks',      price: 70,  isVeg: true,  tags: ['drink'], description: 'Refreshing chilled lemon tea',              image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
  ]);
  await MenuItem.insertMany([
    { restaurant: r3._id, name: 'Classic Beef Burger', category: 'Burgers', price: 199, isVeg: false, tags: ['main'],  description: 'Juicy beef patty with lettuce and cheese', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
    { restaurant: r3._id, name: 'Veggie Burger',       category: 'Burgers', price: 149, isVeg: true,  tags: ['main'],  description: 'Crispy veggie patty with sauces',          image: 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=300' },
    { restaurant: r3._id, name: 'Cheese Fries',        category: 'Sides',   price: 89,  isVeg: true,  tags: ['side'],  description: 'Crispy fries loaded with cheese sauce',    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300' },
    { restaurant: r3._id, name: 'Chocolate Shake',     category: 'Drinks',  price: 99,  isVeg: true,  tags: ['drink'], description: 'Thick and creamy chocolate milkshake',     image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300' },
  ]);
  console.log('Menu items created');

  console.log('\n✅ QickServe seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Customer:         customer@quickserve.com  / user123');
  console.log('Restaurant Admin: admin@quickserve.com     / admin123');
  console.log('Delivery Partner: delivery@quickserve.com  / delivery123');
  console.log('─────────────────────────────────────');
  mongoose.disconnect();
};

seed().catch((err) => { console.error(err); mongoose.disconnect(); });
