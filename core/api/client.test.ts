import { apiClient } from './client';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('API Client Interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
    
    // Simulate a request passing through the interceptor
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    
    await expect(requestInterceptor({ headers: {} })).rejects.toThrow('NO_INTERNET');
  });

  it('should attach token when online and token exists', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mock-token');

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    
    const config = await requestInterceptor({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer mock-token');
  });

  it('should not attach token if it does not exist', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    
    const config = await requestInterceptor({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
