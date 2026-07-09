import { useEffect, useState } from 'react';

import { getAdminSettings, hasAdminSession, updateAdminSettings, type AdminSettings } from '../../lib/api';
import { AdminLayout, AdminLoginRequired } from './AdminLayout';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const hasSession = hasAdminSession();

  useEffect(() => {
    if (!hasSession) return;
    getAdminSettings().then(setSettings).catch((settingsError) => {
      setError(settingsError instanceof Error ? settingsError.message : 'Could not load settings.');
    });
  }, [hasSession]);

  if (!hasSession) return <AdminLoginRequired />;

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSession || !settings) return;
    setSaving(true);
    setStatus('');
    const updated = await updateAdminSettings(settings);
    setSettings(updated);
    setSaving(false);
    setStatus('Settings saved.');
  }

  return (
    <AdminLayout title="Settings">
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
          {status ? <p className="status-label brand-heading">{status}</p> : null}
        </form>
      ) : null}
    </AdminLayout>
  );
}
