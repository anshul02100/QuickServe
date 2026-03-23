import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Delivery.css';

const STATUS_FLOW = ['assigned', 'picked_up', 'on_the_way', 'delivered'];
const STATUS_LABELS = {
  assigned:   '📋 Assigned',
  picked_up:  '📦 Picked Up',
  on_the_way: '🚴 On the Way',
  delivered:  '✅ Delivered',
};

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([
    { _id: 'ORD001', customer: 'Rahul Sharma', address: '12 MG Road, Bangalore', restaurant: 'Spice Garden', items: 3, total: 520, status: 'assigned' },
    { _id: 'ORD002', customer: 'Priya Mehta', address: '45 Koramangala', restaurant: 'Dragon Wok', items: 2, total: 320, status: 'picked_up' },
    { _id: 'ORD003', customer: 'Amit Kumar', address: '78 Indiranagar', restaurant: 'Burger Barn', items: 1, total: 199, status: 'delivered' },
  ]);

  const updateStatus = (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
  };

  const active = orders.filter(o => o.status !== 'delivered');
  const done   = orders.filter(o => o.status === 'delivered');

  return (
    <div className="delivery-page">
      <div className="container">
        <div className="delivery-header">
          <h1>My Deliveries</h1>
          <p>Hello, {user?.name} 👋</p>
        </div>

        <div className="delivery-stats">
          <div className="stat-card"><span>{active.length}</span><label>Active</label></div>
          <div className="stat-card"><span>{done.length}</span><label>Delivered Today</label></div>
          <div className="stat-card"><span>₹{done.reduce((s, o) => s + o.total, 0)}</span><label>Earnings</label></div>
        </div>

        <h2 className="section-title">Active Orders</h2>
        {active.length === 0 && <p className="empty-msg">No active orders right now.</p>}
        <div className="order-cards">
          {active.map(order => {
            const idx  = STATUS_FLOW.indexOf(order.status);
            const next = STATUS_FLOW[idx + 1];
            return (
              <div key={order._id} className="delivery-card">
                <div className="delivery-card__top">
                  <span className="order-id">#{order._id}</span>
                  <span className={`status-badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="delivery-card__info">
                  <p><strong>Customer:</strong> {order.customer}</p>
                  <p><strong>Restaurant:</strong> {order.restaurant}</p>
                  <p><strong>Deliver to:</strong> {order.address}</p>
                  <p><strong>Items:</strong> {order.items} &nbsp;|&nbsp; <strong>Total:</strong> ₹{order.total}</p>
                </div>
                {next && (
                  <button className="btn btn-primary update-btn" onClick={() => updateStatus(order._id, next)}>
                    Mark as {STATUS_LABELS[next]}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {done.length > 0 && (
          <>
            <h2 className="section-title">Completed</h2>
            <div className="order-cards">
              {done.map(order => (
                <div key={order._id} className="delivery-card delivery-card--done">
                  <div className="delivery-card__top">
                    <span className="order-id">#{order._id}</span>
                    <span className="status-badge status-delivered">{STATUS_LABELS.delivered}</span>
                  </div>
                  <div className="delivery-card__info">
                    <p><strong>Customer:</strong> {order.customer}</p>
                    <p><strong>Restaurant:</strong> {order.restaurant}</p>
                    <p><strong>Total:</strong> ₹{order.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
