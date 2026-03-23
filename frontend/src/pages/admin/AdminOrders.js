import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

const STATUSES = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/admin/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-page container">
      <h1 className="page-header">All Orders</h1>
      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Customer</th><th>Restaurant</th>
              <th>Amount</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td className="order-id-cell">#{order._id.slice(-6).toUpperCase()}</td>
                <td>{order.user?.name}<br/><span className="cell-sub">{order.user?.email}</span></td>
                <td>{order.restaurant?.name}</td>
                <td>Rs.{order.totalAmount}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className={`status-select status-${order.status}`}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </td>
                <td className="cell-sub">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
