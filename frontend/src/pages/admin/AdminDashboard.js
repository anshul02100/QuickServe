import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="admin-page container">
      <h1 className="page-header">Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">Rs.{stats.totalRevenue?.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      )}

      <div className="admin-nav-grid">
        {[
          { to: '/admin/restaurants', title: 'Restaurants', desc: 'Add and manage restaurants' },
          { to: '/admin/orders',      title: 'Orders',      desc: 'View and update order status' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="admin-nav-card card">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
