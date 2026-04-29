import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const ROLES = [
  { value: 'customer',         label: 'Customer',          desc: 'Browse menus and place orders',       icon: '🛒' },
  { value: 'restaurant_admin', label: 'Restaurant Admin',  desc: 'Manage items, orders and sales',      icon: '🍽️' },
  { value: 'delivery_partner', label: 'Delivery Partner',  desc: 'Accept & deliver orders on the go',   icon: '🛵' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [selectedRole, setSelectedRole] = useState('customer');
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, expectedRole: selectedRole });
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      if (data.role === 'restaurant_admin') navigate('/admin');
      else if (data.role === 'delivery_partner') navigate('/delivery');
      else navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>QuickServe</h1>
          <p>Sign in to your account</p>
        </div>

        <div className="role-selector">
          <p className="role-label">Sign in as</p>
          <div className="role-options role-options--three">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                className={`role-btn ${selectedRole === r.value ? 'active' : ''}`}
                onClick={() => setSelectedRole(r.value)}
              >
                <span className="role-icon">{r.icon}</span>
                <span className="role-name">{r.label}</span>
                <span className="role-desc">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

        <div className="auth-demo">
          <p>Demo accounts</p>
          <code>customer@quickserve.com / user123</code><br/>
          <code>admin@quickserve.com / admin123</code><br/>
          <code>delivery@quickserve.com / delivery123</code>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
