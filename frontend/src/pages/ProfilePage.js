import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './AuthPage.css';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [form, setForm]   = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/me', form);
      login({ ...user, ...data });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>My Profile</h1>
          <p>{user?.email}</p>
        </div>
        <form className="auth-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Default Delivery Address</label>
            <textarea name="address" rows={3} value={form.address} onChange={handleChange}
              placeholder="Enter your default delivery address" style={{ padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:'8px', resize:'vertical', fontFamily:'var(--font-body)' }} />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
