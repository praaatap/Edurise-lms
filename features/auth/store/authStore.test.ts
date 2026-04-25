import { useAuthStore } from './authStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    login: jest.fn().mockResolvedValue({
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: { _id: '1', email: 'test@example.com' }
      }
    }),
    register: jest.fn().mockResolvedValue({}),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  }
}));

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      localAvatar: null,
    });
    jest.clearAllMocks();
  });

  it('should handle login flow correctly', async () => {
    const store = useAuthStore.getState();
    
    await store.login({ email: 'test@example.com', password: 'password' });
    
    const updatedStore = useAuthStore.getState();
    expect(updatedStore.isAuthenticated).toBe(true);
    expect(updatedStore.token).toBe('mock-token');
    expect(updatedStore.user?.email).toBe('test@example.com');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', 'mock-token');
  });

  it('should handle logout flow correctly', async () => {
    useAuthStore.setState({
      user: { _id: '1', email: 'test@example.com' } as any,
      token: 'mock-token',
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();
    
    const updatedStore = useAuthStore.getState();
    expect(updatedStore.isAuthenticated).toBe(false);
    expect(updatedStore.token).toBeNull();
    expect(updatedStore.user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  });

  it('should update profile correctly', () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'Old Name' } as any,
    });

    useAuthStore.getState().updateProfile({ username: 'New Name' });
    
    expect(useAuthStore.getState().user?.username).toBe('New Name');
  });

  it('should set local avatar', () => {
    useAuthStore.getState().setLocalAvatar('local-uri');
    expect(useAuthStore.getState().localAvatar).toBe('local-uri');
  });
});
