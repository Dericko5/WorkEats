import { useState } from 'react';

export default function LocationInput({ onSearch, loading, disabled }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className="location-form" onSubmit={handleSubmit}>
      <div className="location-input-wrap">
        <span className="location-icon">📍</span>
        <input
          type="text"
          className="location-input"
          placeholder="Enter zip code or city (e.g. 90210 or Chicago, IL)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || loading}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="location-spinner" />}
      </div>
      <button
        type="submit"
        className="btn-primary"
        disabled={loading || !value.trim() || disabled}
      >
        {loading ? 'Searching...' : 'Find Food Near Me'}
      </button>
    </form>
  );
}
