import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

const EMPTY = { name:'', cuisine:'', description:'', address:'', image:'', deliveryTime:30, minOrder:0, rating:4.0 };

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const load = () => api.get('/restaurants').then(({ data }) => setRestaurants(data));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/restaurants/${editId}`, form);
        toast.success('Restaurant updated');
      } else {
        await api.post('/restaurants', form);
        toast.success('Restaurant added');
      }
      setForm(EMPTY); setEditId(null); setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (r) => {
    setForm({ name:r.name, cuisine:r.cuisine, description:r.description, address:r.address,
              image:r.image, deliveryTime:r.deliveryTime, minOrder:r.minOrder, rating:r.rating });
    setEditId(r._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this restaurant?')) return;
    await api.delete(`/restaurants/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="admin-page container">
      <div className="admin-page-header">
        <h1 className="page-header">Restaurants</h1>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>
          + Add Restaurant
        </button>
      </div>

      {showForm && (
        <div className="admin-form card">
          <h3>{editId ? 'Edit Restaurant' : 'Add Restaurant'}</h3>
          <form onSubmit={handleSubmit} className="admin-form-grid">
            {[
              { name:'name', label:'Name', required:true },
              { name:'cuisine', label:'Cuisine', required:true },
              { name:'address', label:'Address', required:true },
              { name:'image', label:'Image URL' },
              { name:'description', label:'Description' },
            ].map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label}</label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} />
              </div>
            ))}
            <div className="form-group">
              <label>Delivery Time (mins)</label>
              <input type="number" name="deliveryTime" value={form.deliveryTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Min Order (Rs.)</label>
              <input type="number" name="minOrder" value={form.minOrder} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <input type="number" name="rating" step="0.1" min="0" max="5" value={form.rating} onChange={handleChange} />
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Cuisine</th><th>Rating</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.cuisine}</td>
                <td>⭐ {r.rating}</td>
                <td className="admin-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/menu/${r._id}`)}>Menu</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                  <button className="btn btn-sm delete-btn" onClick={() => handleDelete(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRestaurants;
