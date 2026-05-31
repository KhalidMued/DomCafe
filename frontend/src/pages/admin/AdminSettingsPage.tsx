import { useEffect, useState } from 'react';

import { getAdminSettings, updateAdminSettings, type AdminSettings } from '../../lib/api';

function AdminLoginRequired() {
  return (
    <main className="page-shell admin-page">
      <section className="status-card">
        <p className="status-label">Admin login required.</p>
        <a className="cart-link" href="/admin/login">Go to login</a>
      </section>
    </main>
  );
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminSettings(token).then(setSettings).catch((settingsError) => {
      setError(settingsError instanceof Error ? settingsError.message : 'Could not load settings.');
    });
  }, [token]);

  if (!token) return <AdminLoginRequired />;

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !settings) return;
    setSaving(true);
    setStatus('');
    const updated = await updateAdminSettings(token, settings);
    setSettings(updated);
    setSaving(false);
    setStatus('Settings saved.');
  }

  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Settings</h1>
        </div>
        <a href="/admin/dashboard">Dashboard</a>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {!settings && !error ? <section className="skeleton-card">Loading settings…</section> : null}
      {settings ? (
        <form className="status-card admin-settings-form" onSubmit={saveSettings}>
          <label>
            Cafe name
            <input
              value={settings.cafe_name}
              onChange={(event) => setSettings({ ...settings, cafe_name: event.currentTarget.value })}
            />
          </label>
          <label>
            Welcome message
            <textarea
              value={settings.welcome_message}
              onChange={(event) => setSettings({ ...settings, welcome_message: event.currentTarget.value })}
            />
          </label>
          <label className="admin-checkbox-label">
            <input
              checked={settings.orders_open}
              onChange={(event) => setSettings({ ...settings, orders_open: event.currentTarget.checked })}
              type="checkbox"
            />
            Orders open
          </label>
          <button disabled={saving} type="submit">Save settings</button>
          {status ? <p className="status-label">{status}</p> : null}
        </form>
      ) : null}
    </main>
  );
}
