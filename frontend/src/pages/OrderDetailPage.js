import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import './OrderDetailPage.css';

const STEPS = ['pending','confirmed','preparing','out_for_delivery','delivered'];
const STEP_LABELS = {
  pending:          'Order Placed',
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  out_for_delivery: 'On the Way',
  delivered:        'Delivered',
};

// Load Razorpay script once
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const OrderDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [order,    setOrder]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [paying,   setPaying]  = useState(false);
  const intervalRef = useRef(null);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
      // Stop polling once delivered or cancelled
      if (['delivered','cancelled'].includes(data.status)) {
        clearInterval(intervalRef.current);
      }
    } catch {
      // silently ignore polling errors
    }
  };

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false));

    // Poll every 10 seconds for status updates
    intervalRef.current = setInterval(fetchOrder, 10000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  const handleRazorpay = async () => {
    if (paying) return;
    setPaying(true);
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Payment gateway failed to load'); setPaying(false); return; }

    try {
      const { data } = await api.post('/payment/create-order', {
        amount: order.totalAmount,
        orderId: order._id,
      });

      const options = {
        key:        data.keyId,
        amount:     data.amount,
        currency:   data.currency,
        name:       'QuickServe',
        description:`Order #${order._id.slice(-6).toUpperCase()}`,
        order_id:   data.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId:response.razorpay_payment_id,
              razorpaySignature:response.razorpay_signature,
              orderId:          order._id,
            });
            toast.success('Payment successful! 🎉');
            fetchOrder();
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: order.user?.name, email: order.user?.email },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => { setPaying(false); }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error('Payment failed'); setPaying(false); });
      rzp.open();
    } catch (err) {
      toast.error('Could not initiate payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!order)  return <div className="container" style={{ padding:'40px' }}>Order not found.</div>;

  const stepIndex = STEPS.indexOf(order.status);
  const isPaid    = order.paymentStatus === 'paid' || order.paymentMethod === 'cash';

  return (
    <div className="order-detail-page container">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/orders')}>
        ← Back to Orders
      </button>

      <div className="order-detail-layout">
        <div>
          <div className="card order-detail-card">
            <h2 className="order-detail-title">Order #{order._id.slice(-6).toUpperCase()}</h2>
            <p className="order-restaurant">{order.restaurant?.name}</p>
            <p className="order-date">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit',
              })}
            </p>

            {order.status !== 'cancelled' && (
              <div className="order-progress">
                {STEPS.filter(s => s !== 'cancelled').map((step, i) => (
                  <React.Fragment key={step}>
                    <div className={`progress-step ${i <= stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`}>
                      <div className="progress-dot" />
                      <span>{STEP_LABELS[step]}</span>
                    </div>
                    {i < STEPS.length - 2 && <div className={`progress-line ${i < stepIndex ? 'done' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="error-msg">This order was cancelled.</div>
            )}

            {/* Live tracking indicator */}
            {!['delivered','cancelled'].includes(order.status) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                padding: '8px 14px', fontSize: '0.82rem', color: '#92400e' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316',
                  display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Live tracking — auto-updates every 10 seconds
              </div>
            )}

            {/* Delivery partner info */}
            {order.deliveryPartner && (
              <div className="delivery-partner-info">
                <strong>🚴 Delivery Partner:</strong> {order.deliveryPartner.name}
                {order.deliveryPartner.phone && <span> · {order.deliveryPartner.phone}</span>}
              </div>
            )}
          </div>

          <div className="card order-detail-card">
            <h3>Items Ordered</h3>
            <div className="order-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-qty">x{item.quantity}</span>
                  <span className="order-item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card order-detail-card">
            <h3>Payment Summary</h3>
            <div className="summary-rows">
              <div className="summary-row"><span>Subtotal</span><span>₹{order.totalAmount - 30 - Math.round(order.totalAmount * 0.045)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>₹30</span></div>
              <div className="summary-row"><span>Taxes (4.5%)</span><span>₹{Math.round(order.totalAmount * 0.045)}</span></div>
              <div className="summary-row summary-total"><span>Total</span><strong>₹{order.totalAmount}</strong></div>
            </div>

            <p className="payment-method-badge">
              {order.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment'}
              {' · '}
              <span style={{ color: order.paymentStatus === 'paid' ? '#16a34a' : '#f97316' }}>
                {order.paymentStatus === 'paid' ? '✅ Paid' : 'Pending'}
              </span>
            </p>

            {order.paymentMethod === 'online' && order.paymentStatus !== 'paid' && (
              <button className="btn btn-primary" style={{ width:'100%', marginTop:12 }} onClick={handleRazorpay} disabled={paying}>
                {paying ? 'Opening Payment...' : `Pay ₹${order.totalAmount} Now`}
              </button>
            )}
          </div>

          <div className="card order-detail-card">
            <h3>Delivery Address</h3>
            <p className="delivery-addr">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
