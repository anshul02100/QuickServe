import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './OrderDetailPage.css';

const STEPS = ['pending','confirmed','preparing','out_for_delivery','delivered'];
const STEP_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'On the Way',
  delivered: 'Delivered',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!order) return <div className="container" style={{padding:'40px'}}>Order not found.</div>;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="order-detail-page container">
      <button className="btn btn-ghost back-link" onClick={() => navigate('/orders')}>
        Back to Orders
      </button>

      <div className="order-detail-layout">
        <div>
          <div className="card order-detail-card">
            <h2 className="order-detail-title">Order #{order._id.slice(-6).toUpperCase()}</h2>
            <p className="order-restaurant">{order.restaurant?.name}</p>
            <p className="order-date">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
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
          </div>

          <div className="card order-detail-card">
            <h3>Items Ordered</h3>
            <div className="order-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-qty">x{item.quantity}</span>
                  <span className="order-item-price">Rs.{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card order-detail-card">
            <h3>Payment Summary</h3>
            <div className="summary-rows">
              <div className="summary-row"><span>Subtotal</span><span>Rs.{order.totalAmount - 30 - Math.round(order.totalAmount * 0.045)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>Rs.30</span></div>
              <div className="summary-row"><span>Taxes</span><span>Rs.{Math.round(order.totalAmount * 0.045)}</span></div>
              <div className="summary-row summary-total"><span>Total</span><strong>Rs.{order.totalAmount}</strong></div>
            </div>
            <p className="payment-method-badge">
              {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
            </p>
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
