import { useState, useEffect } from 'react';
import { fetchNetworkInfo } from '../api.js';

export default function NetworkInfo() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || info) return;
    setLoading(true);
    fetchNetworkInfo()
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, info]);

  return (
    <div className="network-widget">
      <button
        className="network-toggle"
        onClick={() => setOpen((v) => !v)}
        title="Phone access"
      >
        📱 {open ? 'Hide' : 'Use on Phone'}
      </button>

      {open && (
        <div className="network-panel">
          {loading && <p className="network-loading">Loading...</p>}
          {info && !loading && (
            <>
              <p className="network-url">{info.url}</p>
              {info.qrDataUrl ? (
                <img
                  className="network-qr"
                  src={info.qrDataUrl}
                  alt="QR code for phone access"
                />
              ) : (
                <p className="network-fallback">
                  Open <strong>{info.url}</strong> on your phone while on the same WiFi.
                </p>
              )}
              <p className="network-hint">
                Scan the QR code or type the URL on any device connected to your WiFi.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
