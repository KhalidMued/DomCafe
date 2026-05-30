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
      const token = await adminLogin({ username, password });
      window.localStorage.setItem('dom_admin_token', token.access_token);
      navigate('/admin/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Admin login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="welcome-page page-shell">
      <section className="hero-card admin-card">
        <p className="eyebrow">Admin</p>
        <h1>DŌM</h1>
        <p className="tagline">Control room</p>
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
