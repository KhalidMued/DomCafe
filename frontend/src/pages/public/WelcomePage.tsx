import { useEffect, useState, type FormEvent } from 'react';

import { getPublicSettings, type PublicSettings } from '../../lib/api';
import { setGuestName } from '../../store/cartStore';

const fallbackSettings: PublicSettings = {
  cafe_name: 'DŌM',
  welcome_message: 'Welcome to DŌM. Take your time.',
  orders_open: true,
};

export function WelcomePage({ navigate }: { navigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => setSettings(fallbackSettings));
  }, []);

  const activeSettings = settings ?? fallbackSettings;
  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !activeSettings.orders_open) return;
    setGuestName(name);
    navigate('/menu');
  }

  return (
    <main className="welcome-page page-shell">
      <section className="hero-card welcome-hero-card" aria-label="DŌM Home Café">
        <div style={{ textAlign: 'center' }}>
          <svg width="100%" viewBox="0 0 680 220" role="img" xmlns="http://www.w3.org/2000/svg">
            <style>{`
    .hc-label {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 6px;
      fill: #BA7517;
    }
    .wordmark-letter {
      font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
      font-size: 108px;
      font-weight: 300;
      fill: #F1EFE8;
    }
    .tagline {
      font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 2.5px;
      fill: #F1EFE8;
    }
  `}</style>
            <text x="340" y="14" textAnchor="middle" className="hc-label">HOME CAFÉ</text>
            <rect x="316" y="24" width="48" height="1.5" fill="#BA7517" />
            <text x="148" y="148" textAnchor="middle" className="wordmark-letter">D</text>
            <text x="340" y="148" textAnchor="middle" className="wordmark-letter">O</text>
            <rect x="307" y="28" width="66" height="2.5" fill="#F1EFE8" rx="1" />
            <text x="532" y="148" textAnchor="middle" className="wordmark-letter">M</text>
            <text x="340" y="190" textAnchor="middle" className="tagline">Slow coffee.  Deep roots.</text>
          </svg>
        </div>
        <p className="hero-copy" dir="auto">{activeSettings.welcome_message}</p>
        <ul className="welcome-status-row" aria-label="Café service notes">
          <li>{activeSettings.orders_open ? 'Open today' : 'Orders paused'}</li>
          <li>Private roast bar</li>
          <li>Made fresh</li>
        </ul>
        <form className="name-form" onSubmit={start}>
          <label htmlFor="guest-name">Your name</label>
          <input id="guest-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="Ahmed" dir="auto" />
          <button type="submit" disabled={!activeSettings.orders_open}>{activeSettings.orders_open ? 'Start' : 'Orders paused'}</button>
        </form>
      </section>
    </main>
  );
}
