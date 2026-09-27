import { useEffect, useState } from 'react';

const STAGES = [
  { afterMs: 0, text: 'Reading what you wrote…' },
  { afterMs: 2500, text: 'Figuring out what this project actually needs…' },
  { afterMs: 8000, text: 'Checking which skills already exist out there…' },
  { afterMs: 16000, text: 'Writing the ones that don’t…' },
  { afterMs: 32000, text: 'Still working — good skills take a minute.' },
];

export default function LoadingState({ onCancel }) {
  const [message, setMessage] = useState(STAGES[0].text);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage) =>
      setTimeout(() => setMessage(stage.text), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-state">
      <div className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <div className="loading-copy">
          <p className="loading-message" aria-live="polite">{message}</p>
          <p className="loading-hint">You can cancel anytime. Nothing is saved until we finish.</p>
        </div>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
