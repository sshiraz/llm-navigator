import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Create a working localStorage mock with actual storage behavior
const createStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] ?? null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
  };
};

// Mock localStorage
const localStorageMock = createStorageMock();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = createStorageMock();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
