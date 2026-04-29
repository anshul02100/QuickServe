import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

const STATUSES = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];

const AdminOrders = () => {
  const [orders,   setOrders]   = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  const load = () =>
    Promise.all([
      api.get('/admin/orders'),
      api.get('/admin/delivery-partners'),
    ]).then(([o, p]) => {
      setOrders(o.data);
      setPartners(p.data);
    }).finally(() => setLoading(false));

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

  const assignPartner = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return;
    try {
      await api.put(`/admin/orders/${orderId}/assign`, { deliveryPartnerId });
      toast.success('Delivery partner assigned');
      load();
    } catch {
      toast.error('Failed to assign partner');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-page container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:8 }}>
        <h1 className="page-header" style={{ margin:0 }}>All Orders</h1>
        <select className="status-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ minWidth:160 }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <p style={{ color:'#888', marginBottom:16, fontSize:'0.85rem' }}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>

      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Delivery Partner</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order._id}>
                <td className="order-id-cell">#{order._id.slice(-6).toUpperCase()}</td>
                <td>
                  {order.user?.name}
                  <br/><span className="cell-sub">{order.user?.email}</span>
                </td>
                <td>{order.restaurant?.name}</td>
                <td>₹{order.totalAmount}</td>
                <td>
                  <span className={`status-badge ${order.paymentStatus === 'paid' ? 'status-delivered' : 'status-pending'}`}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : order.paymentMethod === 'cash' ? '💵 COD' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order._id, e.target.value)}
                    className={`status-select status-${order.status}`}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </td>
                <td>
                  {order.deliveryPartner ? (
                    <span style={{ fontSize:'0.85rem', color:'#16a34a' }}>✅ {order.deliveryPartner.name || 'Assigned'}</span>
                  ) : (
                    <select
                      defaultValue=""
                      className="status-select"
                      onChange={e => assignPartner(order._id, e.target.value)}
                      disabled={['delivered','cancelled'].includes(order.status)}
                    >
                      <option value="" disabled>Assign…</option>
                      {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  )}
                </td>
                <td className="cell-sub">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:'32px', color:'#888' }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
