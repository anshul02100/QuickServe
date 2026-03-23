import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isCustomer } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          QuickServe
        </Link>

        <div className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          {(!user || isCustomer) && (
            <Link to="/restaurants" onClick={() => setMenuOpen(false)}>Restaurants</Link>
          )}
          {isCustomer && (
            <>
              <Link to="/cart" onClick={() => setMenuOpen(false)} className="cart-link">
                Cart
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          )}

          {user ? (
            <div className="navbar__user">
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="user-name">
                {user.name.split(' ')[0]}
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login"  className="btn btn-ghost"   onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Sign Up</Link>
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
