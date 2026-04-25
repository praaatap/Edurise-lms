// Storage Utils Unit Tests
// Tests the core storage utility which wraps SecureStore and AsyncStorage

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../storage';

const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

const mockAsyncSetItem = AsyncStorage.setItem as jest.Mock;
const mockAsyncGetItem = AsyncStorage.getItem as jest.Mock;
const mockAsyncRemoveItem = AsyncStorage.removeItem as jest.Mock;

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Secure Storage ────────────────────────────────────────────────────
  describe('Secure Storage (expo-secure-store)', () => {
    it('setSecure: calls SecureStore.setItemAsync with correct key/value', async () => {
      await storage.setSecure('token', 'abc123');
      expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
      expect(mockSetItemAsync).toHaveBeenCalledWith('token', 'abc123');
    });

    it('getSecure: returns value from SecureStore', async () => {
      mockGetItemAsync.mockResolvedValueOnce('mySecret');
      const result = await storage.getSecure('token');
      expect(result).toBe('mySecret');
      expect(mockGetItemAsync).toHaveBeenCalledWith('token');
    });

    it('getSecure: returns null when key does not exist', async () => {
      mockGetItemAsync.mockResolvedValueOnce(null);
      const result = await storage.getSecure('missing');
      expect(result).toBeNull();
    });

    it('removeSecure: calls SecureStore.deleteItemAsync with correct key', async () => {
      await storage.removeSecure('token');
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('token');
    });
  });

  // ── Async Storage ─────────────────────────────────────────────────────
  describe('Async Storage (@react-native-async-storage)', () => {
    it('setItem: JSON.stringifies the value before saving', async () => {
      const data = { courses: [1, 2, 3] };
      await storage.setItem('courses', data);
      expect(mockAsyncSetItem).toHaveBeenCalledWith('courses', JSON.stringify(data));
    });

    it('getItem: JSON.parses the value on read', async () => {
      const data = { courses: [1, 2, 3] };
      mockAsyncGetItem.mockResolvedValueOnce(JSON.stringify(data));
      const result = await storage.getItem('courses');
      expect(result).toEqual(data);
    });

    it('getItem: returns null when nothing is stored', async () => {
      mockAsyncGetItem.mockResolvedValueOnce(null);
      const result = await storage.getItem('empty');
      expect(result).toBeNull();
    });

    it('getItem: returns null and does not throw on JSON parse error', async () => {
      mockAsyncGetItem.mockResolvedValueOnce('not-valid-json{{{');
      const result = await storage.getItem('corrupted');
      expect(result).toBeNull();
    });

    it('removeItem: calls AsyncStorage.removeItem with correct key', async () => {
      await storage.removeItem('courses');
      expect(mockAsyncRemoveItem).toHaveBeenCalledWith('courses');
    });
  });
});
