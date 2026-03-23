import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MenuItemCard from '../components/restaurant/MenuItemCard';
import { CartProvider, useCart } from '../context/CartContext';
import './GroupOrderPage.css';

const GroupOrderPage = () => {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groupOrder, setGroupOrder] = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [myItems, setMyItems]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [joining, setJoining]       = useState(false);
  const [placing, setPlacing]       = useState(false);
  const [address, setAddress]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/group-orders/${code}`);
        setGroupOrder(data);
        const mRes = await api.get(`/menu/${data.restaurant._id}`);
        setMenuItems(mRes.data);
        // Pre-fill my items if I'm already a participant
        if (user) {
          const me = data.participants.find(p => p.user?._id === user._id || p.user === user._id);
          if (me) setMyItems(me.items);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Group order not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code, user]);

  const addItem = (item) => {
    setMyItems(prev => {
      const existing = prev.find(i => i.menuItem === item._id);
      if (existing) {
        return prev.map(i => i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1, image: item.image }];
    });
    toast.success(`${item.name} added to your selection`);
  };

  const removeItem = (menuItemId) => {
    setMyItems(prev => prev.filter(i => i.menuItem !== menuItemId));
  };

  const submitMyItems = async () => {
    if (!user) { toast.error('Please login to join'); return; }
    if (myItems.length === 0) { toast.error('Add at least one item'); return; }
    setJoining(true);
    try {
      await api.post(`/group-orders/${code}/join`, { items: myItems });
      toast.success('Your items saved to group order!');
      // Refresh
      const { data } = await api.get(`/group-orders/${code}`);
      setGroupOrder(data);
    } catch (err) {
      toast.error('Could not save items');
    } finally {
      setJoining(false);
    }
  };

  const placeGroupOrder = async () => {
    if (!address.trim()) { toast.error('Enter a delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post(`/group-orders/${code}/place`, { deliveryAddress: address });
      toast.success('Group order placed! 🎉');
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  const isCreator = user && groupOrder && (groupOrder.createdBy === user._id || groupOrder.createdBy?._id === user._id);
  const shareLink = `${window.location.origin}/group-order/${code}`;

  if (loading) return <div className="spinner" />;
  if (!groupOrder) return <div className="container" style={{padding:'40px'}}>Group order not found.</div>;

  return (
    <div className="group-order-page container">
      <div className="group-order-header">
        <div>
          <h1 className="page-header">👥 Group Order</h1>
          <p className="group-restaurant">{groupOrder.restaurant?.name}</p>
        </div>
        <div className="share-code-box">
          <span>Share Code: <strong>{code}</strong></span>
          <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Link copied!'); }}>
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Participants summary */}
      <div className="participants-panel card">
        <h3>Participants ({groupOrder.participants.length})</h3>
        <div className="participants-list">
          {groupOrder.participants.map((p, i) => (
            <div key={i} className="participant">
              <span className="participant-name">
                {p.name} {isCreator && p.user?._id === user?._id ? '(you, creator)' : ''}
              </span>
              <span className="participant-items">{p.items.length} item(s)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="group-layout">
        {/* Menu selection */}
        <div>
          <h3 className="section-sub">Add Your Items</h3>
          <div className="group-menu-list">
            {menuItems.map(item => (
              <div key={item._id} className="group-menu-item">
                <div className="group-menu-item__info">
                  <strong>{item.name}</strong>
                  <span>₹{item.price}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addItem(item)}>+ Add</button>
              </div>
            ))}
          </div>
        </div>

        {/* My selections + actions */}
        <div>
          <div className="card my-selections">
            <h3>Your Selections</h3>
            {myItems.length === 0 ? (
              <p className="no-items-msg">No items added yet</p>
            ) : (
              <div className="my-items-list">
                {myItems.map(item => (
                  <div key={item.menuItem} className="my-item-row">
                    <span className="my-item-name">{item.name} x{item.quantity}</span>
                    <span className="my-item-price">₹{item.price * item.quantity}</span>
                    <button className="remove-btn" onClick={() => removeItem(item.menuItem)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary save-items-btn" onClick={submitMyItems} disabled={joining}>
              {joining ? 'Saving...' : '✔ Save My Items'}
            </button>
          </div>

          {/* Creator: place order */}
          {isCreator && (
            <div className="card place-group-card">
              <h3>Place Group Order</h3>
              <p className="place-group-note">Once all friends have added items, enter the delivery address and place the combined order.</p>
              <textarea rows={3} placeholder="Delivery address..." value={address}
                onChange={e => setAddress(e.target.value)} className="address-input" />
              <button className="btn btn-primary place-group-btn" onClick={placeGroupOrder} disabled={placing}>
                {placing ? 'Placing...' : '🚀 Place Group Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupOrderPage;
