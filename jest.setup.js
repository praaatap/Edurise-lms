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
if (typeof global.structuredClone !== 'function') {
  global.__structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  get: () => ({
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
// Notifications mock
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn(),
}));

// Haptics mock
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
  ImpactFeedbackStyle: { Light: 0, Medium: 1, Heavy: 2 },
}));

// Expo Image mock
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

// Expo Router mock
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => ([]),
  Stack: jest.fn().mockReturnValue(null),
}));

// NativeWind mock
jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
    setColorScheme: jest.fn(),
    toggleColorScheme: jest.fn(),
  }),
}));

// Sentry mock
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c: any) => c,
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  logEvent: jest.fn(),
}));
