import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WelcomeBeans from '../components/three/WelcomeBeans';
import { canShowDecorative3D } from '../lib/webgl';
import { WelcomePage } from '../pages/public/WelcomePage';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      jsonResponse({ cafe_name: 'DŌM', welcome_message: 'Welcome to DŌM. Take your time.', orders_open: true }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('canShowDecorative3D', () => {
  it('returns false when WebGL is unavailable (jsdom default)', () => {
    expect(canShowDecorative3D()).toBe(false);
  });

  it('returns false when the user prefers reduced motion, even with WebGL', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as unknown as RenderingContext);
    expect(canShowDecorative3D()).toBe(false);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('returns true when motion is allowed and a WebGL context exists', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as unknown as RenderingContext);
    expect(canShowDecorative3D()).toBe(true);
  });
});

describe('WelcomeBeans fallback', () => {
  it('renders an empty decorative layer without crashing when WebGL fails', () => {
    const { container } = render(<WelcomeBeans />);
    const layer = container.querySelector('.welcome-beans-layer');
    expect(layer).not.toBeNull();
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('canvas')).toBeNull();
  });
});

describe('WelcomePage without WebGL', () => {
  it('still renders the welcome card and never mounts the beans layer', async () => {
    render(<WelcomePage navigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Welcome to DŌM. Take your time.')).toBeInTheDocument());
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(document.querySelector('.welcome-beans-layer')).toBeNull();
  });
});
