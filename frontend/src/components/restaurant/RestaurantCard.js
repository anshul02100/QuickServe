import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantCard.css';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();

  return (
    <div className="rest-card card" onClick={() => navigate(`/restaurant/${restaurant._id}/menu`)}>
      <div className="rest-card__img-wrap">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400'}
          alt={restaurant.name}
          className="rest-card__img"
        />
        {!restaurant.isOpen && (
          <div className="rest-card__closed-overlay">Closed</div>
        )}
      </div>
      <div className="rest-card__body">
        <h3 className="rest-card__name">{restaurant.name}</h3>
        <p className="rest-card__cuisine">{restaurant.cuisine}</p>
        <div className="rest-card__meta">
          <span className="rest-card__rating">{restaurant.rating}</span>
          <span className="rest-card__dot">·</span>
          <span>{restaurant.deliveryTime} min</span>
          <span className="rest-card__dot">·</span>
          <span>Min Rs.{restaurant.minOrder}</span>
        </div>
        <p className="rest-card__address">{restaurant.address}</p>
      </div>
    </div>
  );
};

export default RestaurantCard;
