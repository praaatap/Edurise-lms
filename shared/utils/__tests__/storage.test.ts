// Storage Utils Unit Tests
// Tests the core storage utility which wraps SecureStore and AsyncStorage

// Module-level mocks must be hoisted before any imports
const mockSetItemAsync = jest.fn().mockResolvedValue(undefined);
const mockGetItemAsync = jest.fn().mockResolvedValue(null);
const mockDeleteItemAsync = jest.fn().mockResolvedValue(undefined);

const mockAsyncSetItem = jest.fn().mockResolvedValue(undefined);
const mockAsyncGetItem = jest.fn().mockResolvedValue(null);
const mockAsyncRemoveItem = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-secure-store', () => ({
  setItemAsync: mockSetItemAsync,
  getItemAsync: mockGetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: mockAsyncSetItem,
  getItem: mockAsyncGetItem,
  removeItem: mockAsyncRemoveItem,
}));

// Import after mocks
import { storage } from '../storage';

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
