import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './GroupOrderPage.css';

const GroupOrderPage = () => {
  const { code }  = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [groupOrder, setGroupOrder] = useState(null);
  const [menuItems,  setMenuItems]  = useState([]);
  const [myItems,    setMyItems]    = useState([]);
  const [address,    setAddress]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [placing,    setPlacing]    = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/group-orders/${code}`);
      setGroupOrder(data);
      if (!menuItems.length) {
        const mRes = await api.get(`/menu/${data.restaurant._id}`);
        setMenuItems(mRes.data);
      }
      if (user) {
        const me = data.participants.find(p => {
          const uid = p.user?._id || p.user;
          return uid?.toString() === user._id?.toString();
        });
        if (me && me.items.length) setMyItems(me.items);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Group order not found');
    } finally {
      setLoading(false);
    }
  }, [code, user]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const addItem = (item) => {
    setMyItems(prev => {
      const hit = prev.find(i => i.menuItem === item._id || i.menuItem?._id === item._id);
      if (hit) return prev.map(i => (i.menuItem === item._id || i.menuItem?._id === item._id)
        ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const changeQty = (menuItemId, delta) => {
    setMyItems(prev => prev
      .map(i => i.menuItem === menuItemId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const saveItems = async () => {
    if (!user) { toast.error('Please login to join'); return; }
    if (!myItems.length) { toast.error('Add at least one item first'); return; }
    setSaving(true);
    try {
      await api.post(`/group-orders/${code}/join`, { items: myItems });
      toast.success('Your items saved! ✅');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save items'); }
    finally { setSaving(false); }
  };

  const placeOrder = async () => {
    if (!address.trim()) { toast.error('Enter a delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post(`/group-orders/${code}/place`, { deliveryAddress: address });
      toast.success('Group order placed! 🎉');
      navigate(`/orders/${data.order._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not place order'); }
    finally { setPlacing(false); }
  };

  const isCreator = user && groupOrder &&
    (groupOrder.createdBy === user._id || groupOrder.createdBy?._id === user._id ||
     groupOrder.createdBy?.toString() === user._id?.toString());

  const shareLink = `${window.location.origin}/group-order/${code}`;
  const mySubtotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);

  if (loading) return <div className="spinner" />;
  if (!groupOrder) return <div className="container" style={{ padding: 40 }}>Group order not found.</div>;

  const expiresIn = Math.max(0, Math.round((new Date(groupOrder.expiresAt) - Date.now()) / 60000));

  return (
    <div className="group-order-page container">
      {/* Header */}
      <div className="group-order-header">
        <div>
          <h1 className="page-header" style={{ marginBottom: 4 }}>👥 Group Order</h1>
          <p className="group-restaurant">{groupOrder.restaurant?.name}</p>
        </div>
        <div className="share-code-box">
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 2 }}>Invite Code</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: 3, color: '#f97316' }}>{code}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => {
            navigator.clipboard.writeText(shareLink);
            toast.success('Link copied!');
          }}>📋 Copy Link</button>
        </div>
      </div>

      {/* Expiry banner */}
      {expiresIn <= 10 && (
        <div className="error-msg" style={{ marginBottom: 12 }}>
          ⏰ Group order expires in {expiresIn} minute{expiresIn !== 1 ? 's' : ''}!
        </div>
      )}

      {/* Participants panel */}
      <div className="participants-panel card">
        <h3>Participants ({groupOrder.participants.length})</h3>
        <div className="participants-list">
          {groupOrder.participants.map((p, i) => {
            const uid   = p.user?._id || p.user;
            const isMe  = uid?.toString() === user?._id?.toString();
            const total = p.items.reduce((s, it) => s + it.price * it.quantity, 0);
            return (
              <div key={i} className="participant">
                <div>
                  <span className="participant-name">{p.name}{isMe ? ' (you)' : ''}</span>
                  <span className="participant-items"> — {p.items.length} item(s)</span>
                </div>
                {total > 0 && <span style={{ fontWeight: 700, color: '#f97316' }}>₹{total}</span>}
              </div>
            );
          })}
        </div>
        {groupOrder.totalAmount > 0 && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Group Total</span>
            <span style={{ color: '#22c55e' }}>₹{groupOrder.totalAmount}</span>
          </div>
        )}
      </div>

      <div className="group-layout">
        {/* Menu */}
        <div>
          <h3 className="section-sub">Add Your Items</h3>
          <div className="group-menu-list">
            {menuItems.filter(m => m.isAvailable !== false).map(item => {
              const inCart = myItems.find(i => i.menuItem === item._id || i.menuItem?._id === item._id);
              return (
                <div key={item._id} className="group-menu-item">
                  <div className="group-menu-item__info">
                    <strong>{item.name}</strong>
                    {item.isVeg !== undefined && (
                      <span style={{ fontSize: '0.7rem', color: item.isVeg ? '#16a34a' : '#dc2626',
                        border: `1px solid ${item.isVeg ? '#16a34a' : '#dc2626'}`,
                        borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                        {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    )}
                    <span style={{ color: '#6b7280', fontSize: '0.82rem', display: 'block', marginTop: 2 }}>{item.description}</span>
                    <span style={{ fontWeight: 700, color: '#f97316' }}>₹{item.price}</span>
                  </div>
                  {inCart ? (
                    <div className="qty-control">
                      <button onClick={() => changeQty(item._id, -1)}>−</button>
                      <span>{inCart.quantity}</span>
                      <button onClick={() => changeQty(item._id, 1)}>+</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => addItem(item)}>+ Add</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* My selections */}
          <div className="card my-selections">
            <h3>Your Selections</h3>
            {myItems.length === 0 ? (
              <p className="no-items-msg">No items added yet</p>
            ) : (
              <>
                <div className="my-items-list">
                  {myItems.map((item, i) => (
                    <div key={i} className="my-item-row">
                      <span className="my-item-name">{item.name} × {item.quantity}</span>
                      <span className="my-item-price">₹{item.price * item.quantity}</span>
                      <button className="remove-btn" onClick={() => changeQty(item.menuItem, -item.quantity)}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Your subtotal</span>
                  <span style={{ color: '#f97316' }}>₹{mySubtotal}</span>
                </div>
              </>
            )}
            <button className="btn btn-primary save-items-btn" onClick={saveItems} disabled={saving}>
              {saving ? 'Saving...' : '✔ Save My Items'}
            </button>
          </div>

          {/* Creator: place order */}
          {isCreator && (
            <div className="card place-group-card">
              <h3>Place Group Order</h3>
              <p className="place-group-note">
                When everyone's done, enter the delivery address and place the combined order.
              </p>
              <textarea rows={3} placeholder="Full delivery address..."
                value={address} onChange={e => setAddress(e.target.value)} className="address-input" />
              <button className="btn btn-primary place-group-btn" onClick={placeOrder} disabled={placing}>
                {placing ? 'Placing...' : `🚀 Place Group Order · ₹${groupOrder.totalAmount}`}
              </button>
            </div>
          )}

          {/* Non-creator waiting message */}
          {!isCreator && (
            <div className="card" style={{ padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p style={{ color: '#92400e', fontSize: '0.88rem', margin: 0 }}>
                ⏳ Waiting for <strong>{groupOrder.participants.find(p => {
                  const uid = p.user?._id || p.user;
                  return uid?.toString() === (groupOrder.createdBy?._id || groupOrder.createdBy)?.toString();
                })?.name || 'the creator'}</strong> to place the order.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupOrderPage;
