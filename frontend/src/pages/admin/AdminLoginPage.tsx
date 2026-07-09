import { useState } from 'react';

import { adminLogin } from '../../lib/api';

export function AdminLoginPage({ navigate }: { navigate: (path: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await adminLogin({ username, password });
      // The session now lives in httpOnly cookies; drop any legacy token.
      window.localStorage.removeItem('dom_admin_token');
      navigate('/admin/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Admin login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="welcome-page page-shell">
      <section className="hero-card admin-card" aria-label="DŌM Admin Login">
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
        <p className="hero-copy">Sign in to manage orders with the same calm pace as the café.</p>
        <form className="name-form" onSubmit={submit}>
          <label htmlFor="admin-username">Username</label>
          <input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
        </form>
      </section>
    </main>
  );
}
