import { useEffect, useRef, useState } from 'react';

const ITEM_H = 72;    // height of each slot item in px
const VISIBLE = 5;    // number of visible items in viewport
const VIEWPORT_H = ITEM_H * VISIBLE;
const HALF = Math.floor(VISIBLE / 2); // 2 — items above/below center

export default function SlotMachine({ restaurants, winner, spinning, onSpinComplete }) {
  const stripRef = useRef(null);
  const winnerIndexRef = useRef(0);
  const [strip, setStrip] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | spinning | done

  useEffect(() => {
    if (!spinning || !winner || restaurants.length === 0) return;

    // Build the strip:
    //   50 random items → winner at index 50 → HALF buffer items after
    //   Buffer items ensure the winner can be centered without blank space below.
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
    const items = [];
    for (let i = 0; i < 50; i++) {
      items.push(shuffled[i % shuffled.length]);
    }
    const winnerIdx = items.length; // 50
    items.push(winner);
    for (let i = 0; i < HALF; i++) {
      items.push(shuffled[i % shuffled.length]);
    }

    winnerIndexRef.current = winnerIdx;
    setStrip(items);
    setPhase('spinning');

    // Step 1: instant-reset to top (no transition)
    if (stripRef.current) {
      stripRef.current.style.transition = 'none';
      stripRef.current.style.transform = 'translateY(0px)';
    }

    // Step 2: after DOM flush, animate to winner position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!stripRef.current) return;
        // Offset so the winner row is vertically centered in the viewport
        const offset = (winnerIdx - HALF) * ITEM_H;
        stripRef.current.style.transition = 'transform 4s cubic-bezier(0.13, 0.81, 0.22, 1)';
        stripRef.current.style.transform = `translateY(-${offset}px)`;
      });
    });

    // Signal done after animation completes
    const timer = setTimeout(() => {
      setPhase('done');
      onSpinComplete?.();
    }, 4200);

    return () => clearTimeout(timer);
  }, [spinning, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="slot-outer">
      {/* Gradient fade at top and bottom */}
      <div className="slot-fade slot-fade-top" />
      <div className="slot-fade slot-fade-bottom" />

      {/* Center highlight bar */}
      <div className="slot-center" />

      <div
        className="slot-viewport"
        style={{ height: VIEWPORT_H }}
        aria-label="Restaurant spinner"
      >
        <div ref={stripRef} className="slot-strip">
          {strip.map((r, i) => {
            const isWinner = phase === 'done' && i === winnerIndexRef.current;
            return (
              <div
                key={i}
                className={`slot-item${isWinner ? ' slot-item--winner' : ''}`}
                style={{ height: ITEM_H }}
              >
                <span className="slot-item-name">{r.name}</span>
                {r.rating && (
                  <span className="slot-item-rating">⭐ {r.rating}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bouncing dots while spinning */}
      {phase === 'spinning' && (
        <div className="slot-dots">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
