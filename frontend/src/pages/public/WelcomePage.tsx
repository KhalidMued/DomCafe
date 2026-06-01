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
      <section className="hero-card welcome-hero-card" aria-labelledby="welcome-title">
        <div className="welcome-title-stack">
          <p className="eyebrow">Home café</p>
          <h1 id="welcome-title">{activeSettings.cafe_name || 'DŌM'}</h1>
        </div>
        <p className="tagline">Slow coffee. Deep roots.</p>
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
