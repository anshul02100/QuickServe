import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const CUISINES = ['Indian', 'Chinese', 'Fast Food', 'Italian', 'South Indian', 'Desserts'];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <h1 className="hero__title">
              Order food from<br/>
              <span className="hero__highlight">top restaurants.</span>
            </h1>
            <p className="hero__sub">
              Browse menus, add to cart, and get your food delivered fast.
            </p>
            <div className="hero__actions">
              <Link to="/restaurants" className="btn btn-primary hero__cta">
                Browse Restaurants
              </Link>
              {!user && (
                <Link to="/signup" className="btn btn-outline">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="cuisines-section container">
        <h2 className="section-title">Browse by cuisine</h2>
        <div className="cuisine-grid">
          {CUISINES.map((c) => (
            <Link key={c} to={`/restaurants?cuisine=${c}`} className="cuisine-chip">
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="container features-grid">
          {[
            { title: 'Fast Delivery', desc: 'Get your food in 30 minutes or less' },
            { title: 'Wide Selection', desc: 'Hundreds of restaurants and cuisines' },
            { title: 'Easy Ordering', desc: 'Browse, add to cart, and checkout in seconds' },
            { title: 'Order Tracking', desc: 'Track your order from placement to delivery' },
          ].map((f) => (
            <div key={f.title} className="feature-card card">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
