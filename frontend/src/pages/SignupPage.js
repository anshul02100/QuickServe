import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const ROLES = [
  { value: 'customer',         label: 'Customer',          icon: '🛒' },
  { value: 'restaurant_admin', label: 'Restaurant Admin',  icon: '🍽️' },
  { value: 'delivery_partner', label: 'Delivery Partner',  icon: '🛵' },
];

const SignupPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data);
      toast.success('Account created. Welcome!');
      if (data.role === 'restaurant_admin') navigate('/admin');
      else if (data.role === 'delivery_partner') navigate('/delivery');
      else navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>Create account</h1>
          <p>Join QuickServe today</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>I am signing up as</label>
            <div className="role-options role-options--three" style={{ marginTop: '8px' }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`role-btn role-btn--compact ${form.role === r.value ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: r.value })}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-name">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" placeholder="John Doe"
              value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input type="tel" name="phone" placeholder="+91 98765 43210"
              value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
