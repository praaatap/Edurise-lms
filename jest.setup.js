/**
 * jest.setup.js
 * Loaded before all tests via `setupFiles` in jest.config.js
 *
 * This file neutralizes the Expo SDK 54 "winter" runtime global that breaks
 * Jest when the project workspace path contains parentheses (like "New folder (2)").
 * Expo's __ExpoImportMetaRegistry treats path segments inside parentheses as
 * route group scope boundaries — the same syntax Expo Router uses — and then
 * rejects `require()` calls as "outside scope".
 *
 * Fix: Override global.__ExpoImportMetaRegistry with a no-op stub before
 * any test code runs.
 */

// Neutralize the Expo winter runtime import scope guard
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  get: () => ({
    // Stub that always returns the current module as "in scope"
    registerModule: () => {},
    getModule: () => null,
    resolveModule: () => null,
  }),
  configurable: true,
});

// SecureStore mock
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// AsyncStorage mock with correct ESM default export pattern
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
  },
}));
