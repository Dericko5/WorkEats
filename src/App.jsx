import { useState, useEffect, useCallback } from 'react';
import { checkConfig, geocode, fetchRestaurants } from './api.js';
import Setup from './components/Setup.jsx';
import LocationInput from './components/LocationInput.jsx';
import SlotMachine from './components/SlotMachine.jsx';
import RestaurantCard from './components/RestaurantCard.jsx';
import NetworkInfo from './components/NetworkInfo.jsx';

// App states
const STATE = {
  LOADING: 'loading',      // checking server config
  SETUP: 'setup',          // no API key
  IDLE: 'idle',            // ready for location input
  SEARCHING: 'searching',  // geocoding + fetching restaurants
  READY: 'ready',          // restaurants loaded, ready to spin
  SPINNING: 'spinning',    // slot machine animating
  RESULT: 'result',        // showing winner card
};

export default function App() {
  const [appState, setAppState] = useState(STATE.LOADING);
  const [restaurants, setRestaurants] = useState([]);
  const [winner, setWinner] = useState(null);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [restaurantCount, setRestaurantCount] = useState(0);

  // Check if API key is configured on mount
  useEffect(() => {
    checkConfig()
      .then(({ hasApiKey }) => {
        setAppState(hasApiKey ? STATE.IDLE : STATE.SETUP);
      })
      .catch(() => {
        // Server not yet ready — retry once after a short delay
        setTimeout(() => {
          checkConfig()
            .then(({ hasApiKey }) => setAppState(hasApiKey ? STATE.IDLE : STATE.SETUP))
            .catch(() => setAppState(STATE.SETUP));
        }, 1500);
      });
  }, []);

  // After setup completes
  function handleSetupComplete() {
    setAppState(STATE.IDLE);
  }

  // Search for restaurants at a given location
  async function handleSearch(address) {
    setError('');
    setRestaurants([]);
    setWinner(null);
    setAppState(STATE.SEARCHING);

    try {
      const { lat, lng, formattedAddress } = await geocode(address);
      setLocation(formattedAddress || address);

      const list = await fetchRestaurants(lat, lng);
      if (!list || list.length === 0) {
        setError('No restaurants found within 5 miles. Try a different location.');
        setAppState(STATE.IDLE);
        return;
      }

      setRestaurants(list);
      setRestaurantCount(list.length);
      setAppState(STATE.READY);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Unknown error';
      if (msg === 'no_api_key') {
        setAppState(STATE.SETUP);
      } else {
        setError(`Error: ${msg}`);
        setAppState(STATE.IDLE);
      }
    }
  }

  // Pick a random winner and start spinning
  const spin = useCallback(
    (excludeId = null) => {
      const pool = excludeId
        ? restaurants.filter((r) => r.place_id !== excludeId)
        : restaurants;

      if (pool.length === 0) return;

      const chosen = pool[Math.floor(Math.random() * pool.length)];
      setWinner(chosen);
      setAppState(STATE.SPINNING);
    },
    [restaurants]
  );

  // Initial spin (from READY state)
  function handleSpin() {
    spin(null);
  }

  // Reroll: exclude current winner for this spin only
  function handleReroll() {
    spin(winner?.place_id);
  }

  // Slot machine animation complete
  function handleSpinComplete() {
    setAppState(STATE.RESULT);
  }

  // Search a new location
  function handleNewSearch() {
    setRestaurants([]);
    setWinner(null);
    setLocation('');
    setAppState(STATE.IDLE);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (appState === STATE.LOADING) {
    return (
      <div className="splash">
        <div className="splash-logo">🍽️</div>
        <p className="splash-text">Starting WorkEats...</p>
      </div>
    );
  }

  if (appState === STATE.SETUP) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  const isSpinning = appState === STATE.SPINNING;
  const showSlot = appState === STATE.SPINNING || appState === STATE.RESULT;
  const showResult = appState === STATE.RESULT;
  const showSpinBtn = appState === STATE.READY;
  const showSearch = appState === STATE.IDLE || appState === STATE.SEARCHING;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">WorkEats</span>
        </div>
        <NetworkInfo />
      </header>

      {/* Main content */}
      <main className="app-main">
        {/* Location search — show only when idle or actively searching */}
        {showSearch && (
          <section className="search-section">
            <h2 className="section-title">
              {appState === STATE.IDLE
                ? "Where are you eating today?"
                : "Searching nearby restaurants..."}
            </h2>
            <LocationInput
              onSearch={handleSearch}
              loading={appState === STATE.SEARCHING}
              disabled={appState === STATE.SEARCHING}
            />
            {error && <p className="error-msg">{error}</p>}
          </section>
        )}

        {/* Ready to spin */}
        {showSpinBtn && !showSlot && (
          <section className="spin-section">
            <p className="found-label">
              🎉 Found <strong>{restaurantCount}</strong> restaurants within 5 miles of{' '}
              <em>{location}</em>
            </p>
            <button className="btn-spin" onClick={handleSpin}>
              <span className="btn-spin-emoji">🎰</span>
              Spin the Wheel!
            </button>
            <button className="btn-ghost" onClick={handleNewSearch}>
              Search a different location
            </button>
          </section>
        )}

        {/* Slot machine */}
        {showSlot && (
          <section className="slot-section">
            <p className="slot-label">
              {isSpinning
                ? '🎲 Spinning through the options...'
                : `✨ Tonight you're eating at...`}
            </p>
            <SlotMachine
              restaurants={restaurants}
              winner={winner}
              spinning={isSpinning}
              onSpinComplete={handleSpinComplete}
            />
          </section>
        )}

        {/* Winner card */}
        {showResult && winner && (
          <section className="result-section">
            <RestaurantCard
              restaurant={winner}
              onReroll={handleReroll}
              spinning={isSpinning}
            />
            <div className="result-footer">
              <button className="btn-ghost" onClick={handleNewSearch}>
                🔍 Search new location
              </button>
              <button className="btn-ghost" onClick={handleSpin}>
                🔄 Spin again (full pool)
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
