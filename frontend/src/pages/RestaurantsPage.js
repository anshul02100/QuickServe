import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import './RestaurantsPage.css';

const RestaurantsPage = () => {
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState(searchParams.get('cuisine') || '');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)  params.search  = search;
      if (cuisine) params.cuisine = cuisine;
      const { data } = await api.get('/restaurants', { params });
      setRestaurants(data);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, [cuisine]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="restaurants-page container">
      <div className="restaurants-header">
        <h1 className="page-header">Restaurants</h1>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text" placeholder="Search restaurants..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {cuisine && (
        <div className="active-filter">
          Showing: <strong>{cuisine}</strong>
          <button onClick={() => setCuisine('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="spinner" />
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <p>No restaurants found.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;
