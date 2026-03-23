import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

const EMPTY = { name:'', category:'', price:'', description:'', image:'', isVeg:false, tags:'' };

const AdminMenu = () => {
  const { restaurantId } = useParams();
  const [items, setItems]   = useState([]);
  const [form, setForm]     = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  const load = () => api.get(`/menu/${restaurantId}`).then(({ data }) => setItems(data));
  useEffect(() => {
    load();
    api.get(`/restaurants/${restaurantId}`).then(({ data }) => setRestaurant(data));
  }, [restaurantId]);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, restaurant: restaurantId, price: Number(form.price),
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags };
    try {
      if (editId) {
        await api.put(`/menu/${editId}`, payload);
        toast.success('Item updated');
      } else {
        await api.post('/menu', payload);
        toast.success('Item added');
      }
      setForm(EMPTY); setEditId(null); setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (item) => {
    setForm({ name:item.name, category:item.category, price:item.price, description:item.description,
              image:item.image, isVeg:item.isVeg, tags:(item.tags||[]).join(', ') });
    setEditId(item._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(`/menu/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="admin-page container">
      <div className="admin-page-header">
        <h1 className="page-header">Menu — {restaurant?.name}</h1>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="admin-form card">
          <h3>{editId ? 'Edit Item' : 'Add Menu Item'}</h3>
          <form onSubmit={handleSubmit} className="admin-form-grid">
            {[
              { name:'name', label:'Item Name', required:true },
              { name:'category', label:'Category (e.g. Main Course)', required:true },
              { name:'price', label:'Price (Rs.)', type:'number', required:true },
              { name:'image', label:'Image URL' },
              { name:'description', label:'Description' },
              { name:'tags', label:'Tags (comma-separated: main, drink, side, dessert)' },
            ].map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label}</label>
                <input type={f.type || 'text'} name={f.name} value={form[f.name]}
                  onChange={handleChange} required={f.required} />
              </div>
            ))}
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} />
                &nbsp;Vegetarian
              </label>
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
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Veg</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>Rs.{item.price}</td>
                <td>{item.isVeg ? '🟢' : '🔴'}</td>
                <td className="admin-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn btn-sm delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMenu;
