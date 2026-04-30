# QuickServe

MERN stack restaurant ordering system built for TCS-693.

## Setup

**Backend**
```bash
cd backend
npm install
npm run seed
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

Requires MongoDB running locally. App runs at `http://localhost:3000`.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Customer | customer@quickserve.com | user123 |
| Restaurant Admin | admin@quickserve.com | admin123 |
| Delivery Partner | delivery@quickserve.com | delivery123 |

## Features

- Customer: browse restaurants, cart, place orders, group orders, online payment
- Restaurant Admin: manage menu & orders, analytics dashboard
- Delivery Partner: accept and deliver orders

## Environment Variables

Edit `backend/.env`:

```
MONGO_URI=mongodb://localhost:27017/quickserve
JWT_SECRET=changeme
PORT=5000
```
