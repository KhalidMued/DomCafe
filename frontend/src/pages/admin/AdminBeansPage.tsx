import { useEffect, useState } from 'react';

import {
  archiveAdminBean,
  createAdminBean,
  getAdminMenu,
  updateAdminBeanAvailability,
  updateAdminBeanDetails,
  type AdminMenuManagement,
} from '../../lib/api';
import { AdminLayout, AdminLoginRequired } from './AdminLayout';

type BeanDraft = {
  id: string;
  name: string;
  origin: string;
  process: string;
  tastingNotes: string;
};

function listText(values: string[]) {
  return values.join(', ');
}

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const emptyDraft: BeanDraft = { id: '', name: '', origin: '', process: '', tastingNotes: '' };

export function AdminBeansPage() {
  const [beans, setBeans] = useState<AdminMenuManagement['beans']>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [newBeanDraft, setNewBeanDraft] = useState<BeanDraft | null>(null);
  const [editingBeanId, setEditingBeanId] = useState('');
  const [beanDraft, setBeanDraft] = useState<BeanDraft | null>(null);
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminMenu(token)
      .then((menu) => setBeans(menu.beans))
      .catch((beansError) => {
        setError(beansError instanceof Error ? beansError.message : 'Could not load beans.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <AdminLoginRequired />;

  async function saveNewBean() {
    if (!token || !newBeanDraft) return;
    setUpdatingId('new-bean');
    setError('');
    try {
      const created = await createAdminBean(token, {
        id: newBeanDraft.id,
        name: newBeanDraft.name,
        origin: newBeanDraft.origin,
        process: newBeanDraft.process,
        tasting_notes: parseList(newBeanDraft.tastingNotes),
      });
      setBeans((current) => [...current, created]);
      setNewBeanDraft(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create bean.');
    } finally {
      setUpdatingId('');
    }
  }

  function startBeanEdit(bean: AdminMenuManagement['beans'][number]) {
    setEditingBeanId(bean.id);
    setBeanDraft({
      id: bean.id,
      name: bean.name,
      origin: bean.origin ?? '',
      process: bean.process ?? '',
      tastingNotes: listText(bean.tasting_notes),
    });
  }

  async function saveBeanEdit(beanId: string) {
    if (!token || !beanDraft) return;
    setUpdatingId(`${beanId}-details`);
    setError('');
    try {
      const updated = await updateAdminBeanDetails(token, beanId, {
        name: beanDraft.name,
        origin: beanDraft.origin,
        process: beanDraft.process,
        tasting_notes: parseList(beanDraft.tastingNotes),
      });
      setBeans((current) => current.map((bean) => bean.id === beanId ? updated : bean));
      setEditingBeanId('');
      setBeanDraft(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not save bean.');
    } finally {
      setUpdatingId('');
    }
  }

  async function toggleBean(beanId: string, nextValue: boolean) {
    if (!token) return;
    setUpdatingId(beanId);
    setError('');
    try {
      const updated = await updateAdminBeanAvailability(token, beanId, nextValue);
      setBeans((current) => current.map((bean) => bean.id === beanId ? { ...bean, is_available: updated.is_available } : bean));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update bean.');
    } finally {
      setUpdatingId('');
    }
  }

  async function archiveBean(beanId: string) {
    if (!token) return;
    setUpdatingId(`${beanId}-archive`);
    setError('');
    try {
      const archived = await archiveAdminBean(token, beanId);
      setBeans((current) => current.map((bean) => bean.id === beanId ? archived : bean));
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Could not archive bean.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <AdminLayout title="Beans">
      <section className="status-card admin-menu-toolbar">
        <div>
          <p className="status-label">Bean management</p>
          <p className="detail-copy">Add and manage beans used by menu drinks.</p>
        </div>
        <button onClick={() => setNewBeanDraft(emptyDraft)} type="button">Add bean</button>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <section className="skeleton-card">Loading beans…</section> : null}
      {newBeanDraft ? (
        <form className="status-card admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveNewBean(); }}>
          <label>New bean id<input value={newBeanDraft.id} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, id: event.currentTarget.value })} /></label>
          <label>New bean name<input value={newBeanDraft.name} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, name: event.currentTarget.value })} dir="auto" /></label>
          <label>New bean origin<input value={newBeanDraft.origin} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, origin: event.currentTarget.value })} dir="auto" /></label>
          <label>New bean process<input value={newBeanDraft.process} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, process: event.currentTarget.value })} dir="auto" /></label>
          <label>New bean tasting notes<input value={newBeanDraft.tastingNotes} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, tastingNotes: event.currentTarget.value })} dir="auto" /></label>
          <button disabled={updatingId === 'new-bean'} type="submit">Create bean</button>
        </form>
      ) : null}
      {!loading && beans.length === 0 ? <section className="skeleton-card">No beans yet.</section> : null}
      {beans.length > 0 ? (
        <section className="admin-management-grid" aria-label="Admin beans management">
          {beans.map((bean) => (
            <article className="status-card admin-menu-card" key={bean.id} aria-label={`${bean.name} controls`}>
              <div>
                <h2 dir="auto">{bean.name}</h2>
                {bean.origin ? <p className="detail-copy" dir="auto">{bean.origin}</p> : null}
                {bean.process ? <p dir="auto">{bean.process}</p> : null}
                {bean.tasting_notes.length ? <p className="detail-copy" dir="auto">{listText(bean.tasting_notes)}</p> : null}
                <p>{bean.is_available ? 'Available' : 'Unavailable'}</p>
              </div>
              {editingBeanId === bean.id && beanDraft ? (
                <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveBeanEdit(bean.id); }}>
                  <label>Bean name<input value={beanDraft.name} onChange={(event) => setBeanDraft({ ...beanDraft, name: event.currentTarget.value })} dir="auto" /></label>
                  <label>Origin<input value={beanDraft.origin} onChange={(event) => setBeanDraft({ ...beanDraft, origin: event.currentTarget.value })} dir="auto" /></label>
                  <label>Process<input value={beanDraft.process} onChange={(event) => setBeanDraft({ ...beanDraft, process: event.currentTarget.value })} dir="auto" /></label>
                  <label>Tasting notes<input value={beanDraft.tastingNotes} onChange={(event) => setBeanDraft({ ...beanDraft, tastingNotes: event.currentTarget.value })} dir="auto" /></label>
                  <button disabled={updatingId === `${bean.id}-details`} type="submit">Save bean</button>
                </form>
              ) : null}
              <div className="admin-menu-actions">
                <button onClick={() => startBeanEdit(bean)} type="button">Edit bean</button>
                <button disabled={updatingId === bean.id} onClick={() => toggleBean(bean.id, !bean.is_available)} type="button">
                  {bean.is_available ? 'Mark unavailable' : 'Mark available'}
                </button>
                <button disabled={updatingId === `${bean.id}-archive`} onClick={() => archiveBean(bean.id)} type="button">Archive bean</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </AdminLayout>
  );
}
