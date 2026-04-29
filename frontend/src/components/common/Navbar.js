import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isCustomer, isDelivery } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const handleLogout = () => { logout(); navigate('/'); close(); };

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={close}>QuickServe</Link>

        <div className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          {(!user || isCustomer) && (
            <Link to="/restaurants" onClick={close}>Restaurants</Link>
          )}

          {isCustomer && (
            <>
              <Link to="/cart" onClick={close} className="cart-link">
                Cart{itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <Link to="/orders" onClick={close}>Orders</Link>
              {/* Group order — start one from cart or join via link */}
            </>
          )}

          {isAdmin && (
            <Link to="/admin" onClick={close}>Dashboard</Link>
          )}

          {isDelivery && (
            <Link to="/delivery" onClick={close}>My Deliveries</Link>
          )}

          {user ? (
            <div className="navbar__user">
              <Link to="/profile" onClick={close} className="user-name">
                {user.name.split(' ')[0]}
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login"  className="btn btn-ghost"   onClick={close}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={close}>Sign Up</Link>
            </div>
          )}
        </div>

        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
