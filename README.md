# QuickServe

A food ordering platform with role-based access for customers and restaurant admins.

## Modules Implemented

1. **User Registration & Login** — Signup and login with role separation (Customer / Restaurant Admin)
2. **Authentication & Role-Based Access** — JWT auth, protected routes, role-specific dashboards
3. **Core Functionalities** — Menu listing, search, add to cart, and place orders

## Project Structure

```
quickserve/
├── backend/          # Node.js + Express API
│   ├── models/       # Mongoose models (User, MenuItem, Restaurant, Order)
│   ├── routes/       # Auth, menu, restaurants, orders, cart, admin
│   ├── middleware/   # JWT auth middleware
│   └── config/       # DB seed data
└── frontend/         # React app
    └── src/
        ├── pages/    # All page components
        ├── components/
        ├── context/  # Auth + Cart context
        └── utils/    # API client
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # add your MONGO_URI and JWT_SECRET
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Demo Accounts
- **Customer:** customer@quickserve.com / user123
- **Admin:** admin@quickserve.com / admin123
