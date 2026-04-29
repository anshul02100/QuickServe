import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MenuItemCard from '../components/restaurant/MenuItemCard';
import './MenuPage.css';

const MenuPage = () => {
  const { id } = useParams();
  const { itemCount, totalPrice } = useCart();
  const { user, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant]   = useState(null);
  const [menuItems, setMenuItems]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setCategory] = useState('All');
  const [startingGroup, setStartingGroup] = useState(false);

  const startGroupOrder = async () => {
    if (!user) { toast.error('Please login to start a group order'); navigate('/login'); return; }
    setStartingGroup(true);
    try {
      const { data } = await api.post('/group-orders', { restaurantId: id });
      const code = data.inviteCode;
      toast.success(`Group order created! Code: ${code}`);
      navigate(`/group-order/${code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start group order');
    } finally { setStartingGroup(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu/${id}`),
        ]);
        setRestaurant(rRes.data);
        setMenuItems(mRes.data);
      } catch {
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const categories = ['All', ...new Set(menuItems.map((i) => i.category))];
  const filtered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter((i) => i.category === activeCategory);

  if (loading) return <div className="spinner" />;
  if (!restaurant) return <div className="container" style={{padding:'40px'}}>Restaurant not found.</div>;

  return (
    <div className="menu-page">
      <div className="menu-header">
        <div className="container menu-header__inner">
          <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>Back</button>
          <div>
            <h1 className="menu-header__name">{restaurant.name}</h1>
            <p className="menu-header__meta">
              {restaurant.cuisine} · {restaurant.rating} stars · {restaurant.deliveryTime} min · Min order Rs.{restaurant.minOrder}
            </p>
          </div>
          {isCustomer && (
            <button className="btn btn-outline btn-sm" onClick={startGroupOrder} disabled={startingGroup}
              style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {startingGroup ? '...' : '👥 Group Order'}
            </button>
          )}
        </div>
      </div>

      <div className="container menu-layout">
        <div className="menu-content">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-items-list">
            {filtered.length === 0 ? (
              <p className="empty-state">No items in this category.</p>
            ) : (
              filtered.map((item) => <MenuItemCard key={item._id} item={item} />)
            )}
          </div>
        </div>

        {itemCount > 0 && (
          <div className="cart-sidebar">
            <div className="cart-sidebar__inner card">
              <h3>Your Cart</h3>
              <p className="cart-sidebar__count">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
              <div className="cart-sidebar__total">
                <span>Total</span>
                <strong>Rs.{totalPrice}</strong>
              </div>
              <button className="btn btn-primary cart-sidebar__btn" onClick={() => navigate('/cart')}>
                View Cart & Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
