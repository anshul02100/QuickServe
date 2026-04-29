import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './Delivery.css';

const STATUS_LABELS = {
  confirmed:        '✅ Confirmed',
  preparing:        '🍳 Preparing',
  out_for_delivery: '🚴 Out for Delivery',
  delivered:        '✅ Delivered',
};

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [myOrders,  setMyOrders]  = useState([]);
  const [available, setAvailable] = useState([]);
  const [stats,     setStats]     = useState({ deliveredCount: 0, activeCount: 0, earnings: 0 });
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('active');

  const load = useCallback(async () => {
    try {
      const [myRes, avaRes, statsRes] = await Promise.all([
        api.get('/delivery/orders'),
        api.get('/delivery/available'),
        api.get('/delivery/stats'),
      ]);
      setMyOrders(myRes.data);
      setAvailable(avaRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const acceptOrder = async (orderId) => {
    try {
      await api.post(`/delivery/accept/${orderId}`);
      toast.success('Order accepted!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/delivery/orders/${orderId}/status`, { status });
      toast.success('Status updated!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const active = myOrders.filter(o => o.status !== 'delivered');
  const done   = myOrders.filter(o => o.status === 'delivered');

  if (loading) return <div className="spinner" />;

  return (
    <div className="delivery-page">
      <div className="container">
        <div className="delivery-header">
          <div>
            <h1>Delivery Dashboard</h1>
            <p>Hello, {user?.name} 👋</p>
          </div>
          <button className="btn btn-ghost" onClick={load}>↻ Refresh</button>
        </div>

        <div className="delivery-stats">
          <div className="stat-card"><span>{stats.activeCount}</span><label>Active</label></div>
          <div className="stat-card"><span>{stats.deliveredCount}</span><label>Delivered</label></div>
          <div className="stat-card"><span>₹{stats.earnings}</span><label>Earnings</label></div>
          <div className="stat-card"><span>{available.length}</span><label>Available</label></div>
        </div>

        <div className="delivery-tabs">
          {[
            { key: 'active',    label: `Active (${active.length})` },
            { key: 'available', label: `Available (${available.length})` },
            { key: 'done',      label: `Completed (${done.length})` },
          ].map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'active' && (
          <>
            {active.length === 0 && <p className="empty-msg">No active orders. Check available tab to accept one.</p>}
            <div className="order-cards">
              {active.map(order => (
                <div key={order._id} className="delivery-card">
                  <div className="delivery-card__top">
                    <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className={`status-badge status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                  <div className="delivery-card__info">
                    <p><strong>Customer:</strong> {order.user?.name}{order.user?.phone && <span className="cell-sub"> · {order.user.phone}</span>}</p>
                    <p><strong>Restaurant:</strong> {order.restaurant?.name}</p>
                    <p><strong>Pickup at:</strong> {order.restaurant?.address || '—'}</p>
                    <p><strong>Deliver to:</strong> {order.deliveryAddress}</p>
                    <p><strong>Items:</strong> {order.items.length} &nbsp;|&nbsp; <strong>Total:</strong> ₹{order.totalAmount}</p>
                  </div>
                  {order.status === 'out_for_delivery' && (
                    <button className="btn btn-primary update-btn" onClick={() => updateStatus(order._id, 'delivered')}>
                      Mark as Delivered ✅
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'available' && (
          <>
            {available.length === 0 && <p className="empty-msg">No available orders right now. Check back soon!</p>}
            <div className="order-cards">
              {available.map(order => (
                <div key={order._id} className="delivery-card delivery-card--available">
                  <div className="delivery-card__top">
                    <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className={`status-badge status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                  <div className="delivery-card__info">
                    <p><strong>Restaurant:</strong> {order.restaurant?.name}</p>
                    <p><strong>Pickup at:</strong> {order.restaurant?.address || '—'}</p>
                    <p><strong>Deliver to:</strong> {order.deliveryAddress}</p>
                    <p><strong>Items:</strong> {order.items.length} &nbsp;|&nbsp; <strong>Total:</strong> ₹{order.totalAmount}</p>
                  </div>
                  <button className="btn btn-primary update-btn" onClick={() => acceptOrder(order._id)}>
                    Accept Order 🚴
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'done' && (
          <>
            {done.length === 0 && <p className="empty-msg">No completed deliveries yet.</p>}
            <div className="order-cards">
              {done.map(order => (
                <div key={order._id} className="delivery-card delivery-card--done">
                  <div className="delivery-card__top">
                    <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className="status-badge status-delivered">✅ Delivered</span>
                  </div>
                  <div className="delivery-card__info">
                    <p><strong>Customer:</strong> {order.user?.name}</p>
                    <p><strong>Restaurant:</strong> {order.restaurant?.name}</p>
                    <p><strong>Total:</strong> ₹{order.totalAmount}</p>
                    <p className="cell-sub">{new Date(order.updatedAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
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
