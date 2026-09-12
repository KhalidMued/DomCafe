import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getMenu, type PublicMenuCategory } from '../lib/api';
import { MenuPage } from '../pages/public/MenuPage';

vi.mock('../lib/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/api')>(),
  getMenu: vi.fn(),
}));

const curated = [
  ['americano-149e0b75623445f597ff219f6fb3b975.png', 'menu-americano.webp'],
  ['espresso-0dec0500485a47b48d9ee4897f4296b0.png', 'menu-espresso.webp'],
  ['cappuccino-0edac8698e204c009bc55cae2e0c9661.png', 'menu-cappuccino.webp'],
  ['caramel_latte-069eadbbdb0c4849a98f795e56220af5.png', 'menu-caramel-latte.webp'],
  ['cortado-60ba909207594814b5da1367996e4451.png', 'menu-cortado.webp'],
  ['flat_white-9f943db79e1e42859363d286edfc4a43.png', 'menu-flat-white.webp'],
];

function category(id: string, urls: string[]): PublicMenuCategory {
  return {
    id, name: id, description: '',
    drinks: urls.map((photo_url, index) => ({
      id: `${id}-${index}`, name: `${id} ${index}`, description: 'Coffee',
      ingredients: [], bean: null, photo_url, available: true,
      temperature_options: ['hot'], milk_options: [], estimated_time_minutes: 3,
    })),
  };
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('serves optimized copies of exactly the six curated PNG URLs without changing menu data', async () => {
  const menu = [category('coffee', curated.map(([original]) => `/uploads/drinks/${original}`))];
  const original = structuredClone(menu);
  vi.mocked(getMenu).mockResolvedValue(menu);
  render(<MenuPage navigate={vi.fn()} />);
  const images = await screen.findAllByRole('img');
  images.forEach((image, index) => {
    expect(image).toHaveAttribute('src', `/uploads/drinks/${curated[index][1]}`);
    expect(image).toHaveAttribute('alt', `coffee ${index}`);
  });
  expect(menu).toEqual(original);
});

it('keeps other images, placeholders, external URLs and future uploads unchanged', async () => {
  const urls = [
    '/uploads/drinks/placeholder.jpg',
    '/uploads/drinks/americano-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
    '/uploads/drinks/new-curated.png',
    `https://example.com/uploads/drinks/${curated[0][0]}`,
    `/uploads/drinks/${curated[0][0]}?v=2`,
  ];
  vi.mocked(getMenu).mockResolvedValue([category('other', urls)]);
  render(<MenuPage navigate={vi.fn()} />);
  (await screen.findAllByRole('img')).forEach((image, index) => expect(image).toHaveAttribute('src', urls[index]));
});

it.each([1, 4])('eager-loads only the first two rendered photos across categories (first section has %i)', async (count) => {
  vi.mocked(getMenu).mockResolvedValue([
    category('empty', []),
    category('first', Array(count).fill('/uploads/drinks/placeholder.jpg')),
    category('second', Array(3).fill('/uploads/drinks/placeholder.jpg')),
  ]);
  render(<MenuPage navigate={vi.fn()} />);
  (await screen.findAllByRole('img')).forEach((image, index) => {
    expect(image).toHaveAttribute('loading', index < 2 ? 'eager' : 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
  });
});
