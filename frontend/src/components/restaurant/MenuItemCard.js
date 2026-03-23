import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './MenuItemCard.css';

const MenuItemCard = ({ item }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!user) { toast.error('Please login to add items'); return; }
    setAdding(true);
    try {
      await addToCart(item._id, 1);
      toast.success(`${item.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="menu-item card">
      {item.image && (
        <img src={item.image} alt={item.name} className="menu-item__img" />
      )}
      <div className="menu-item__body">
        <div className="menu-item__top">
          <span className={`veg-indicator ${item.isVeg ? 'veg' : 'nonveg'}`} title={item.isVeg ? 'Veg' : 'Non-veg'} />
          <h4 className="menu-item__name">{item.name}</h4>
        </div>
        {item.description && (
          <p className="menu-item__desc">{item.description}</p>
        )}
        <div className="menu-item__footer">
          <span className="menu-item__price">Rs.{item.price}</span>
          <button className="btn btn-primary menu-item__btn" onClick={handleAdd} disabled={adding}>
            {adding ? '...' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
