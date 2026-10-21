import { render, screen } from '@testing-library/react';
import App from './App';
import { supabase } from './supabase';
import { getClassesWithAvailability } from './lib/classService';
import { createLeaderboardFunction } from './lib/leaderboardService';

jest.mock('./components/ui/calendar', () => ({ Calendar: () => null }));
jest.mock('nanoid', () => ({ nanoid: () => 'demo-id' }));

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));
jest.mock('./lib/classService', () => ({ getClassesWithAvailability: jest.fn().mockResolvedValue([]) }));
jest.mock('./lib/leaderboardService', () => ({ createLeaderboardFunction: jest.fn().mockResolvedValue(undefined) }));

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false, media: '', onchange: null,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  });
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  (getClassesWithAvailability as jest.Mock).mockResolvedValue([]);
  (createLeaderboardFunction as jest.Mock).mockResolvedValue(undefined);
});

test('an unauthenticated visitor is sent to the sign-in screen', async () => {
  window.history.replaceState({}, '', '/home');
  render(<App />);
  expect(await screen.findByRole('heading', { name: /welcome to fitflex/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});
