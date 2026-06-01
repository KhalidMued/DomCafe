import { useEffect, useState } from 'react';

import {
  archiveAdminBean,
  archiveAdminCategory,
  archiveAdminDrink,
  createAdminBean,
  createAdminCategory,
  createAdminDrink,
  getAdminMenu,
  updateAdminBeanAvailability,
  updateAdminBeanDetails,
  updateAdminCategoryAvailability,
  updateAdminCategoryDetails,
  updateAdminDrinkAvailability,
  updateAdminDrinkDetails,
  updateAdminOrdersOpen,
  uploadAdminDrinkPhoto,
  type AdminMenuManagement,
} from '../../lib/api';

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

type DrinkDraft = {
  name: string;
  categoryId: string;
  beanId: string;
  description: string;
  ingredients: string;
  temperatureOptions: string;
  milkOptions: string;
  estimatedMinutes: string;
};

type CategoryDraft = {
  label: string;
  description: string;
  accentColor: string;
  displayOrder: string;
};

type NewCategoryDraft = CategoryDraft & { id: string };

type NewDrinkDraft = DrinkDraft & { id: string; photoUrl: string };

type BeanDraft = {
  name: string;
  origin: string;
  process: string;
  tastingNotes: string;
};

type NewBeanDraft = BeanDraft & { id: string };

function listText(values: string[]) {
  return values.join(', ');
}

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function AdminMenuPage() {
  const [menu, setMenu] = useState<AdminMenuManagement | null>(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [editingDrinkId, setEditingDrinkId] = useState('');
  const [drinkDraft, setDrinkDraft] = useState<DrinkDraft | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [editingBeanId, setEditingBeanId] = useState('');
  const [beanDraft, setBeanDraft] = useState<BeanDraft | null>(null);
  const [newDrinkDraft, setNewDrinkDraft] = useState<NewDrinkDraft | null>(null);
  const [newCategoryDraft, setNewCategoryDraft] = useState<NewCategoryDraft | null>(null);
  const [newBeanDraft, setNewBeanDraft] = useState<NewBeanDraft | null>(null);
  const token = window.localStorage.getItem('dom_admin_token');

  useEffect(() => {
    if (!token) return;
    getAdminMenu(token).then(setMenu).catch((menuError) => {
      setError(menuError instanceof Error ? menuError.message : 'Could not load menu management.');
    });
  }, [token]);

  if (!token) return <AdminLoginRequired />;

  async function toggleOrdersOpen() {
    if (!token || !menu) return;
    setUpdatingId('orders-open');
    const updated = await updateAdminOrdersOpen(token, !menu.orders_open);
    setMenu({ ...menu, orders_open: updated.orders_open });
    setUpdatingId('');
  }

  async function toggleDrink(drinkId: string, nextValue: boolean) {
    if (!token || !menu) return;
    setUpdatingId(drinkId);
    const updated = await updateAdminDrinkAvailability(token, drinkId, nextValue);
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? { ...drink, is_available: updated.is_available } : drink) });
    setUpdatingId('');
  }

  async function toggleBean(beanId: string, nextValue: boolean) {
    if (!token || !menu) return;
    setUpdatingId(beanId);
    const updated = await updateAdminBeanAvailability(token, beanId, nextValue);
    setMenu({ ...menu, beans: menu.beans.map((bean) => bean.id === beanId ? { ...bean, is_available: updated.is_available } : bean) });
    setUpdatingId('');
  }

  async function toggleCategory(categoryId: string, nextValue: boolean) {
    if (!token || !menu) return;
    setUpdatingId(categoryId);
    const updated = await updateAdminCategoryAvailability(token, categoryId, nextValue);
    setMenu({ ...menu, categories: menu.categories.map((category) => category.id === categoryId ? { ...category, is_available: updated.is_available } : category) });
    setUpdatingId('');
  }

  async function replaceDrinkPhoto(drinkId: string, photo: File | undefined) {
    if (!token || !menu || !photo) return;
    setUpdatingId(`${drinkId}-photo`);
    const updated = await uploadAdminDrinkPhoto(token, drinkId, photo);
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? { ...drink, photo_url: updated.photo_url } : drink) });
    setUpdatingId('');
  }

  function startDrinkEdit(drink: AdminMenuManagement['drinks'][number]) {
    setEditingDrinkId(drink.id);
    setDrinkDraft({
      name: drink.name,
      categoryId: drink.category_id,
      beanId: drink.bean_id ?? '',
      description: drink.description ?? '',
      ingredients: listText(drink.ingredients),
      temperatureOptions: listText(drink.temperature_options),
      milkOptions: listText(drink.milk_options),
      estimatedMinutes: String(drink.estimated_time_minutes),
    });
  }

  function updateDrinkDraft(field: keyof DrinkDraft, value: string) {
    setDrinkDraft((draft) => draft ? { ...draft, [field]: value } : draft);
  }

  async function saveDrinkEdit(drinkId: string) {
    if (!token || !menu || !drinkDraft) return;
    setUpdatingId(`${drinkId}-details`);
    const updated = await updateAdminDrinkDetails(token, drinkId, {
      name: drinkDraft.name,
      category_id: drinkDraft.categoryId,
      default_bean_id: drinkDraft.beanId,
      description: drinkDraft.description,
      ingredients: parseList(drinkDraft.ingredients),
      temperature_options: parseList(drinkDraft.temperatureOptions),
      milk_options: parseList(drinkDraft.milkOptions),
      estimated_time_minutes: Number(drinkDraft.estimatedMinutes),
    });
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? updated : drink) });
    setEditingDrinkId('');
    setDrinkDraft(null);
    setUpdatingId('');
  }

  function startCategoryEdit(category: AdminMenuManagement['categories'][number]) {
    setEditingCategoryId(category.id);
    setCategoryDraft({
      label: category.label,
      description: category.description ?? '',
      accentColor: category.accent_color ?? '',
      displayOrder: String(category.display_order),
    });
  }

  function updateCategoryDraft(field: keyof CategoryDraft, value: string) {
    setCategoryDraft((draft) => draft ? { ...draft, [field]: value } : draft);
  }

  async function saveCategoryEdit(categoryId: string) {
    if (!token || !menu || !categoryDraft) return;
    setUpdatingId(`${categoryId}-details`);
    const updated = await updateAdminCategoryDetails(token, categoryId, {
      label: categoryDraft.label,
      description: categoryDraft.description,
      accent_color: categoryDraft.accentColor,
      display_order: Number(categoryDraft.displayOrder),
    });
    setMenu({ ...menu, categories: menu.categories.map((category) => category.id === categoryId ? updated : category) });
    setEditingCategoryId('');
    setCategoryDraft(null);
    setUpdatingId('');
  }

  function startBeanEdit(bean: AdminMenuManagement['beans'][number]) {
    setEditingBeanId(bean.id);
    setBeanDraft({
      name: bean.name,
      origin: bean.origin ?? '',
      process: bean.process ?? '',
      tastingNotes: listText(bean.tasting_notes),
    });
  }

  function updateBeanDraft(field: keyof BeanDraft, value: string) {
    setBeanDraft((draft) => draft ? { ...draft, [field]: value } : draft);
  }

  async function saveBeanEdit(beanId: string) {
    if (!token || !menu || !beanDraft) return;
    setUpdatingId(`${beanId}-details`);
    const updated = await updateAdminBeanDetails(token, beanId, {
      name: beanDraft.name,
      origin: beanDraft.origin,
      process: beanDraft.process,
      tasting_notes: parseList(beanDraft.tastingNotes),
    });
    setMenu({ ...menu, beans: menu.beans.map((bean) => bean.id === beanId ? updated : bean) });
    setEditingBeanId('');
    setBeanDraft(null);
    setUpdatingId('');
  }

  async function saveNewCategory() {
    if (!token || !menu || !newCategoryDraft) return;
    const created = await createAdminCategory(token, {
      id: newCategoryDraft.id,
      label: newCategoryDraft.label,
      description: newCategoryDraft.description,
      accent_color: newCategoryDraft.accentColor,
      display_order: Number(newCategoryDraft.displayOrder),
    });
    setMenu({ ...menu, categories: [...menu.categories, created] });
    setNewCategoryDraft(null);
  }

  async function saveNewBean() {
    if (!token || !menu || !newBeanDraft) return;
    const created = await createAdminBean(token, {
      id: newBeanDraft.id,
      name: newBeanDraft.name,
      origin: newBeanDraft.origin,
      process: newBeanDraft.process,
      tasting_notes: parseList(newBeanDraft.tastingNotes),
    });
    setMenu({ ...menu, beans: [...menu.beans, created] });
    setNewBeanDraft(null);
  }

  async function saveNewDrink() {
    if (!token || !menu || !newDrinkDraft) return;
    const created = await createAdminDrink(token, {
      id: newDrinkDraft.id,
      name: newDrinkDraft.name,
      category_id: newDrinkDraft.categoryId,
      default_bean_id: newDrinkDraft.beanId,
      description: newDrinkDraft.description,
      ingredients: parseList(newDrinkDraft.ingredients),
      photo_url: newDrinkDraft.photoUrl,
      temperature_options: parseList(newDrinkDraft.temperatureOptions),
      milk_options: parseList(newDrinkDraft.milkOptions),
      estimated_time_minutes: Number(newDrinkDraft.estimatedMinutes),
    });
    setMenu({ ...menu, drinks: [...menu.drinks, created] });
    setNewDrinkDraft(null);
  }

  async function archiveDrink(drinkId: string) {
    if (!token || !menu) return;
    const archived = await archiveAdminDrink(token, drinkId);
    setMenu({ ...menu, drinks: menu.drinks.map((drink) => drink.id === drinkId ? archived : drink) });
  }

  async function archiveCategory(categoryId: string) {
    if (!token || !menu) return;
    const archived = await archiveAdminCategory(token, categoryId);
    setMenu({ ...menu, categories: menu.categories.map((category) => category.id === categoryId ? archived : category) });
  }

  async function archiveBean(beanId: string) {
    if (!token || !menu) return;
    const archived = await archiveAdminBean(token, beanId);
    setMenu({ ...menu, beans: menu.beans.map((bean) => bean.id === beanId ? archived : bean) });
  }

  return (
    <main className="page-shell admin-page">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Menu management</h1>
        </div>
        <a href="/admin/dashboard">Dashboard</a>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {!menu && !error ? <section className="skeleton-card">Loading menu management…</section> : null}
      {menu ? (
        <>
          <section className="status-card admin-menu-toolbar">
            <p className="status-label">{menu.orders_open ? 'Orders are open' : 'Orders are closed'}</p>
            <button disabled={updatingId === 'orders-open'} onClick={toggleOrdersOpen} type="button">
              {menu.orders_open ? 'Close orders' : 'Open orders'}
            </button>
          </section>
          <section className="admin-management-grid" aria-label="Admin drinks management">
            <h2>Drinks</h2>
            <button onClick={() => setNewDrinkDraft({ id: '', name: '', categoryId: menu.categories[0]?.id ?? '', beanId: menu.beans[0]?.id ?? '', description: '', ingredients: '', photoUrl: '', temperatureOptions: '', milkOptions: '', estimatedMinutes: '5' })} type="button">Add drink</button>
            {newDrinkDraft ? (
              <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveNewDrink(); }}>
                <label>New drink id<input value={newDrinkDraft.id} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, id: event.currentTarget.value })} /></label>
                <label>New drink name<input value={newDrinkDraft.name} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, name: event.currentTarget.value })} dir="auto" /></label>
                <label>New drink category<select value={newDrinkDraft.categoryId} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, categoryId: event.currentTarget.value })}>{menu.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
                <label>New drink default bean<select value={newDrinkDraft.beanId} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, beanId: event.currentTarget.value })}>{menu.beans.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}</option>)}</select></label>
                <label>New drink description<textarea value={newDrinkDraft.description} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, description: event.currentTarget.value })} dir="auto" /></label>
                <label>New drink ingredients<input value={newDrinkDraft.ingredients} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, ingredients: event.currentTarget.value })} dir="auto" /></label>
                <label>New drink photo URL<input value={newDrinkDraft.photoUrl} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, photoUrl: event.currentTarget.value })} /></label>
                <label>New drink temperature options<input value={newDrinkDraft.temperatureOptions} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, temperatureOptions: event.currentTarget.value })} dir="auto" /></label>
                <label>New drink milk options<input value={newDrinkDraft.milkOptions} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, milkOptions: event.currentTarget.value })} dir="auto" /></label>
                <label>New drink estimated minutes<input min="1" max="30" type="number" value={newDrinkDraft.estimatedMinutes} onChange={(event) => setNewDrinkDraft({ ...newDrinkDraft, estimatedMinutes: event.currentTarget.value })} /></label>
                <button type="submit">Create drink</button>
              </form>
            ) : null}
            {menu.drinks.map((drink) => {
              const drinkMeta = `${listText(drink.temperature_options)} · ${listText(drink.milk_options)} · ${drink.estimated_time_minutes} min`;
              return (
              <article className="status-card admin-menu-card" key={drink.id} aria-label={`${drink.name} controls`}>
                <img src={drink.photo_url} alt={`${drink.name} photo`} />
                <div>
                  <h3 dir="auto">{drink.name}</h3>
                  <p className="detail-copy" dir="auto">{drink.category_name}</p>
                  {drink.bean_name ? <p className="detail-copy" dir="auto">{drink.bean_name}</p> : null}
                  {drink.description ? <p dir="auto">{drink.description}</p> : null}
                  {drink.ingredients.length ? <p className="detail-copy" dir="auto">{listText(drink.ingredients)}</p> : null}
                  <p className="detail-copy" dir="auto">{drinkMeta}</p>
                  <p>{drink.is_available ? 'Available' : 'Unavailable'}</p>
                </div>
                {editingDrinkId === drink.id && drinkDraft ? (
                  <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveDrinkEdit(drink.id); }}>
                    <label>
                      Drink name
                      <input value={drinkDraft.name} onChange={(event) => updateDrinkDraft('name', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Category
                      <select value={drinkDraft.categoryId} onChange={(event) => updateDrinkDraft('categoryId', event.currentTarget.value)}>
                        {menu.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                      </select>
                    </label>
                    <label>
                      Default bean
                      <select value={drinkDraft.beanId} onChange={(event) => updateDrinkDraft('beanId', event.currentTarget.value)}>
                        {menu.beans.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}</option>)}
                      </select>
                    </label>
                    <label>
                      Description
                      <textarea value={drinkDraft.description} onChange={(event) => updateDrinkDraft('description', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Ingredients
                      <input value={drinkDraft.ingredients} onChange={(event) => updateDrinkDraft('ingredients', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Temperature options
                      <input value={drinkDraft.temperatureOptions} onChange={(event) => updateDrinkDraft('temperatureOptions', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Milk options
                      <input value={drinkDraft.milkOptions} onChange={(event) => updateDrinkDraft('milkOptions', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Estimated minutes
                      <input min="1" max="30" type="number" value={drinkDraft.estimatedMinutes} onChange={(event) => updateDrinkDraft('estimatedMinutes', event.currentTarget.value)} />
                    </label>
                    <button disabled={updatingId === `${drink.id}-details`} type="submit">Save drink</button>
                  </form>
                ) : null}
                <div className="admin-menu-actions">
                  <button onClick={() => startDrinkEdit(drink)} type="button">Edit drink</button>
                  <label>
                    Replace photo
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      disabled={updatingId === `${drink.id}-photo`}
                      onChange={(event) => replaceDrinkPhoto(drink.id, event.currentTarget.files?.[0])}
                      type="file"
                    />
                  </label>
                  <button disabled={updatingId === drink.id} onClick={() => toggleDrink(drink.id, !drink.is_available)} type="button">
                    {drink.is_available ? 'Mark unavailable' : 'Mark available'}
                  </button>
                  <button onClick={() => archiveDrink(drink.id)} type="button">Archive drink</button>
                </div>
              </article>
              );
            })}
          </section>
          <section className="admin-management-grid" aria-label="Admin categories management">
            <h2>Categories</h2>
            <button onClick={() => setNewCategoryDraft({ id: '', label: '', description: '', accentColor: '', displayOrder: '0' })} type="button">Add category</button>
            {newCategoryDraft ? (
              <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveNewCategory(); }}>
                <label>New category id<input value={newCategoryDraft.id} onChange={(event) => setNewCategoryDraft({ ...newCategoryDraft, id: event.currentTarget.value })} /></label>
                <label>New category name<input value={newCategoryDraft.label} onChange={(event) => setNewCategoryDraft({ ...newCategoryDraft, label: event.currentTarget.value })} dir="auto" /></label>
                <label>New category description<textarea value={newCategoryDraft.description} onChange={(event) => setNewCategoryDraft({ ...newCategoryDraft, description: event.currentTarget.value })} dir="auto" /></label>
                <label>New category accent color<input value={newCategoryDraft.accentColor} onChange={(event) => setNewCategoryDraft({ ...newCategoryDraft, accentColor: event.currentTarget.value })} /></label>
                <label>New category display order<input min="0" max="1000" type="number" value={newCategoryDraft.displayOrder} onChange={(event) => setNewCategoryDraft({ ...newCategoryDraft, displayOrder: event.currentTarget.value })} /></label>
                <button type="submit">Create category</button>
              </form>
            ) : null}
            {menu.categories.map((category) => (
              <article className="status-card admin-menu-card" key={category.id} aria-label={`${category.label} controls`}>
                <div>
                  <h3 dir="auto">{category.label}</h3>
                  {category.description ? <p dir="auto">{category.description}</p> : null}
                  {category.accent_color ? <p className="detail-copy">{category.accent_color}</p> : null}
                  <p className="detail-copy">Order {category.display_order}</p>
                  <p>{category.is_available ? 'Available' : 'Unavailable'}</p>
                </div>
                {editingCategoryId === category.id && categoryDraft ? (
                  <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveCategoryEdit(category.id); }}>
                    <label>
                      Category name
                      <input value={categoryDraft.label} onChange={(event) => updateCategoryDraft('label', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Category description
                      <textarea value={categoryDraft.description} onChange={(event) => updateCategoryDraft('description', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Accent color
                      <input value={categoryDraft.accentColor} onChange={(event) => updateCategoryDraft('accentColor', event.currentTarget.value)} />
                    </label>
                    <label>
                      Display order
                      <input min="0" max="1000" type="number" value={categoryDraft.displayOrder} onChange={(event) => updateCategoryDraft('displayOrder', event.currentTarget.value)} />
                    </label>
                    <button disabled={updatingId === `${category.id}-details`} type="submit">Save category</button>
                  </form>
                ) : null}
                <div className="admin-menu-actions">
                  <button onClick={() => startCategoryEdit(category)} type="button">Edit category</button>
                  <button disabled={updatingId === category.id} onClick={() => toggleCategory(category.id, !category.is_available)} type="button">
                    {category.is_available ? 'Mark unavailable' : 'Mark available'}
                  </button>
                  <button onClick={() => archiveCategory(category.id)} type="button">Archive category</button>
                </div>
              </article>
            ))}
          </section>
          <section className="admin-management-grid" aria-label="Admin beans management">
            <h2>Beans</h2>
            <button onClick={() => setNewBeanDraft({ id: '', name: '', origin: '', process: '', tastingNotes: '' })} type="button">Add bean</button>
            {newBeanDraft ? (
              <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveNewBean(); }}>
                <label>New bean id<input value={newBeanDraft.id} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, id: event.currentTarget.value })} /></label>
                <label>New bean name<input value={newBeanDraft.name} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, name: event.currentTarget.value })} dir="auto" /></label>
                <label>New bean origin<input value={newBeanDraft.origin} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, origin: event.currentTarget.value })} dir="auto" /></label>
                <label>New bean process<input value={newBeanDraft.process} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, process: event.currentTarget.value })} dir="auto" /></label>
                <label>New bean tasting notes<input value={newBeanDraft.tastingNotes} onChange={(event) => setNewBeanDraft({ ...newBeanDraft, tastingNotes: event.currentTarget.value })} dir="auto" /></label>
                <button type="submit">Create bean</button>
              </form>
            ) : null}
            {menu.beans.map((bean) => (
              <article className="status-card admin-menu-card" key={bean.id} aria-label={`${bean.name} controls`}>
                <div>
                  <h3 dir="auto">{bean.name}</h3>
                  {bean.origin ? <p className="detail-copy" dir="auto">{bean.origin}</p> : null}
                  {bean.process ? <p dir="auto">{bean.process}</p> : null}
                  {bean.tasting_notes.length ? <p className="detail-copy" dir="auto">{listText(bean.tasting_notes)}</p> : null}
                  <p>{bean.is_available ? 'Available' : 'Unavailable'}</p>
                </div>
                {editingBeanId === bean.id && beanDraft ? (
                  <form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); saveBeanEdit(bean.id); }}>
                    <label>
                      Bean name
                      <input value={beanDraft.name} onChange={(event) => updateBeanDraft('name', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Origin
                      <input value={beanDraft.origin} onChange={(event) => updateBeanDraft('origin', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Process
                      <input value={beanDraft.process} onChange={(event) => updateBeanDraft('process', event.currentTarget.value)} dir="auto" />
                    </label>
                    <label>
                      Tasting notes
                      <input value={beanDraft.tastingNotes} onChange={(event) => updateBeanDraft('tastingNotes', event.currentTarget.value)} dir="auto" />
                    </label>
                    <button disabled={updatingId === `${bean.id}-details`} type="submit">Save bean</button>
                  </form>
                ) : null}
                <div className="admin-menu-actions">
                  <button onClick={() => startBeanEdit(bean)} type="button">Edit bean</button>
                  <button disabled={updatingId === bean.id} onClick={() => toggleBean(bean.id, !bean.is_available)} type="button">
                    {bean.is_available ? 'Mark unavailable' : 'Mark available'}
                  </button>
                  <button onClick={() => archiveBean(bean.id)} type="button">Archive bean</button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
