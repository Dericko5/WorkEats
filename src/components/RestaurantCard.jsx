import { photoUrl, mapsDirectionsUrl } from '../api.js';

const PRICE = ['', '$', '$$', '$$$', '$$$$'];

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars" title={`${rating} / 5`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
      <span className="rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function RestaurantCard({ restaurant, onReroll, spinning }) {
  if (!restaurant) return null;

  const {
    name,
    vicinity,
    rating,
    user_ratings_total,
    price_level,
    open_now,
    photo_ref,
    lat,
    lng,
  } = restaurant;

  const hasPhoto = !!photo_ref;
  const directionsUrl = mapsDirectionsUrl(lat, lng);

  return (
    <div className="result-card" key={restaurant.place_id}>
      {hasPhoto && (
        <div className="card-photo-wrap">
          <img
            className="card-photo"
            src={photoUrl(photo_ref, 600)}
            alt={name}
            loading="lazy"
          />
          <div className="card-photo-overlay" />
        </div>
      )}

      <div className="card-body">
        {/* Open / Closed badge */}
        {open_now !== null && (
          <span className={`badge ${open_now ? 'badge-open' : 'badge-closed'}`}>
            {open_now ? '● Open Now' : '● Closed'}
          </span>
        )}

        <h2 className="card-name">{name}</h2>

        <div className="card-meta">
          {rating && (
            <span className="card-rating">
              <Stars rating={rating} />
              {user_ratings_total > 0 && (
                <span className="card-reviews">({user_ratings_total.toLocaleString()})</span>
              )}
            </span>
          )}
          {price_level > 0 && (
            <span className="card-price">{PRICE[price_level]}</span>
          )}
        </div>

        {vicinity && (
          <p className="card-address">
            <span className="card-address-icon">📍</span>
            {vicinity}
          </p>
        )}

        <div className="card-actions">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-directions"
          >
            🗺 Get Directions
          </a>
          <button
            className="btn-reroll"
            onClick={onReroll}
            disabled={spinning}
          >
            🎲 Reroll
          </button>
        </div>

        <p className="card-reroll-hint">
          Reroll picks a new restaurant — this one comes back next spin!
        </p>
      </div>
    </div>
  );
}
