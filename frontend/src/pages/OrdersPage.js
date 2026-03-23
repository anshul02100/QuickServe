import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './OrdersPage.css';

const STATUS_COLORS = {
  pending:          'badge-yellow',
  confirmed:        'badge-green',
  preparing:        'badge-yellow',
  out_for_delivery: 'badge-green',
  delivered:        'badge-green',
  cancelled:        'badge-red',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="orders-page container">
      <h1 className="page-header">My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card card" onClick={() => navigate(`/orders/${order._id}`)}>
              <div className="order-card__left">
                {order.restaurant?.image && (
                  <img src={order.restaurant.image} alt="" className="order-card__img" />
                )}
                <div>
                  <h3 className="order-card__name">{order.restaurant?.name}</h3>
                  <p className="order-card__items">
                    {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                  </p>
                  <p className="order-card__date">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="order-card__right">
                <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <strong className="order-card__total">Rs.{order.totalAmount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
