import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './CartPage.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const CartPage = () => {
  const { cart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.address || '');
  const [payment, setPayment] = useState('cash');
  const [placing, setPlacing] = useState(false);

  const handleQuantity = (itemId, delta, currentQty) => {
    updateQuantity(itemId, currentQty + delta);
  };

  const placeOrderAndPay = async () => {
    if (!address.trim()) { toast.error('Please enter a delivery address'); return; }
    if (!cart.items || cart.items.length === 0) { toast.error('Cart is empty'); return; }

    setPlacing(true);
    try {
      // Always create the order first
      const { data: order } = await api.post('/orders', {
        restaurantId:    cart.restaurant?._id || cart.restaurant,
        items:           cart.items.map(i => ({ menuItem: i.menuItem, name: i.name, price: i.price, quantity: i.quantity })),
        deliveryAddress: address,
        paymentMethod:   payment,
      });

      await clearCart();

      if (payment === 'online') {
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway unavailable'); navigate(`/orders/${order._id}`); return; }

        const { data: rzpData } = await api.post('/payment/create-order', { amount: order.totalAmount, orderId: order._id });

        const options = {
          key:      rzpData.keyId,
          amount:   rzpData.amount,
          currency: rzpData.currency,
          name:     'QuickServe',
          description: `Order #${order._id.slice(-6).toUpperCase()}`,
          order_id: rzpData.razorpayOrderId,
          handler: async (response) => {
            try {
              await api.post('/payment/verify', {
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId:           order._id,
              });
              toast.success('Payment successful! 🎉');
            } catch {
              toast.error('Payment verification failed — contact support');
            } finally {
              navigate(`/orders/${order._id}`);
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#f97316' },
          modal: { ondismiss: () => { toast('Payment skipped — you can pay from Order Details'); navigate(`/orders/${order._id}`); } },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => { toast.error('Payment failed'); navigate(`/orders/${order._id}`); });
        rzp.open();
      } else {
        toast.success('Order placed successfully!');
        navigate(`/orders/${order._id}`);
      }
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

          <button className="btn btn-primary place-order-btn" onClick={placeOrderAndPay} disabled={placing}>
            {placing ? 'Placing Order...' : `Place Order · Rs.${grandTotal}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
