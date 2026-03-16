import { useState } from 'react';
import { saveApiKey } from '../api.js';

export default function Setup({ onComplete }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      await saveApiKey(trimmed);
      onComplete();
    } catch (err) {
      setError('Could not save key. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-icon">🗝️</div>
        <h1 className="setup-title">Welcome to WorkEats</h1>
        <p className="setup-subtitle">
          To find restaurants near you, WorkEats needs a Google Maps API key.
          It's free for personal use — follow the steps below.
        </p>

        <div className="setup-steps">
          <div className="step">
            <span className="step-num">1</span>
            <span>
              Go to{' '}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                console.cloud.google.com
              </a>
            </span>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <span>Create a new project (or use an existing one)</span>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <span>
              Enable <strong>Places API</strong> and <strong>Geocoding API</strong>
            </span>
          </div>
          <div className="step">
            <span className="step-num">4</span>
            <span>
              Go to <em>APIs &amp; Services → Credentials</em> → Create API Key
            </span>
          </div>
          <div className="step">
            <span className="step-num">5</span>
            <span>Paste it below — your key stays on your machine only</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="text"
            className="setup-input"
            placeholder="AIza..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            spellCheck={false}
          />
          {error && <p className="setup-error">{error}</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !key.trim()}
          >
            {loading ? 'Saving...' : 'Save & Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
