import { authenticateBiometric, secureSave, secureGet } from './security';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('Security Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Biometric Authentication', () => {
    it('should return true if hardware not present (fallback)', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);
      const res = await authenticateBiometric();
      expect(res).toBe(true);
    });

    it('should return true if successful', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
      
      const res = await authenticateBiometric();
      expect(res).toBe(true);
    });

    it('should return false if unsuccessful', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: false });
      
      const res = await authenticateBiometric();
      expect(res).toBe(false);
    });
  });

  describe('Secure Store Helpers', () => {
    it('should save securely', async () => {
      await secureSave('key', 'value');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
    });

    it('should get securely', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('value');
      const res = await secureGet('key');
      expect(res).toBe('value');
    });
  });
});
