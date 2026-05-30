import { useEffect, useState } from 'react';

import { getPublicSettings, type PublicSettings } from '../../lib/api';
import { setGuestName } from '../../store/cartStore';

export function WelcomePage({ navigate }: { navigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => setSettings({ cafe_name: 'DŌM', welcome_message: 'Welcome to DŌM. Take your time.', orders_open: true }));
  }, []);

  function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setGuestName(name);
    navigate('/menu');
  }

  return (
    <main className="welcome-page page-shell">
      <section className="hero-card">
        <p className="eyebrow">Home café</p>
        <h1>DŌM</h1>
        <p className="tagline">Slow coffee. Deep roots.</p>
        <p className="hero-copy">{settings?.welcome_message ?? 'Welcome to DŌM. Take your time.'}</p>
        <form className="name-form" onSubmit={start}>
          <label htmlFor="guest-name">Your name</label>
          <input id="guest-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="Ahmed" />
          <button type="submit">Start</button>
        </form>
      </section>
    </main>
  );
}
