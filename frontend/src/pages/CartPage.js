import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './CartPage.css';

const CartPage = () => {
  const { cart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress]   = useState(user?.address || '');
  const [payment, setPayment]   = useState('cash');
  const [placing, setPlacing]   = useState(false);

  const handleQuantity = (itemId, delta, currentQty) => {
    updateQuantity(itemId, currentQty + delta);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { toast.error('Please enter a delivery address'); return; }
    if (!cart.items || cart.items.length === 0) { toast.error('Cart is empty'); return; }

    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        restaurantId:    cart.restaurant?._id || cart.restaurant,
        items:           cart.items.map((i) => ({
          menuItem: i.menuItem, name: i.name, price: i.price, quantity: i.quantity,
        })),
        deliveryAddress: address,
        paymentMethod:   payment,
      });
      await clearCart();
      toast.success('Order placed successfully');
      navigate(`/orders/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty container">
        <h2>Your cart is empty</h2>
        <p>Add items from a restaurant to get started</p>
        <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  const taxes = Math.round(totalPrice * 0.05);
  const deliveryFee = 30;
  const grandTotal = totalPrice + taxes + deliveryFee;

  return (
    <div className="cart-page container">
      <h1 className="page-header">Your Cart</h1>

      <div className="cart-layout">
        <div className="cart-items card">
          <div className="cart-restaurant-name">
            {cart.restaurant?.name || 'Restaurant'}
          </div>
          {cart.items.map((item) => (
            <div key={item.menuItem} className="cart-item">
              {item.image && <img src={item.image} alt={item.name} className="cart-item__img" />}
              <div className="cart-item__info">
                <span className="cart-item__name">{item.name}</span>
                <span className="cart-item__price">Rs.{item.price}</span>
              </div>
              <div className="qty-control">
                <button onClick={() => handleQuantity(item.menuItem, -1, item.quantity)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantity(item.menuItem, 1, item.quantity)}>+</button>
              </div>
              <span className="cart-item__subtotal">Rs.{item.price * item.quantity}</span>
            </div>
          ))}
          <button className="btn btn-ghost clear-cart" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="checkout-panel">
          <div className="card checkout-card">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row"><span>Subtotal</span><span>Rs.{totalPrice}</span></div>
              <div className="summary-row"><span>Delivery fee</span><span>Rs.{deliveryFee}</span></div>
              <div className="summary-row"><span>Taxes (5%)</span><span>Rs.{taxes}</span></div>
              <div className="summary-row summary-total">
                <span>Total</span><strong>Rs.{grandTotal}</strong>
              </div>
            </div>
          </div>

          <div className="card checkout-card">
            <h3>Delivery Address</h3>
            <textarea
              rows={3}
              placeholder="Enter your full delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="address-input"
            />
          </div>

          <div className="card checkout-card">
            <h3>Payment Method</h3>
            <div className="payment-options">
              {[
                { value: 'cash', label: 'Cash on Delivery' },
                { value: 'online', label: 'Online Payment' },
              ].map((p) => (
                <label key={p.value} className={`payment-option ${payment === p.value ? 'selected' : ''}`}>
                  <input type="radio" value={p.value} checked={payment === p.value} onChange={() => setPayment(p.value)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-primary place-order-btn" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : `Place Order · Rs.${grandTotal}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
