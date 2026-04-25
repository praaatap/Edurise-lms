import { authApi } from './authApi';
import { apiClient } from '@/core/api/client';

jest.mock('@/core/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  }
}));

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call login endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ 
      data: { 
        data: { accessToken: 'token' },
        success: true 
      } 
    });
    
    const res = await authApi.login({ email: 'test@example.com', password: 'password' });
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/login', {
      email: 'test@example.com',
      password: 'password'
    });
    expect(res.data.accessToken).toBe('token');
  });

  it('should call register endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    
    await authApi.register({ email: 'test@example.com', password: 'password', username: 'Test', role: 'student' });
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/register', {
      email: 'test@example.com',
      password: 'password',
      username: 'Test',
      role: 'student'
    });
  });

  it('should get current user', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { user: { id: '1' } } });
    
    await authApi.getCurrentUser();
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/current-user');
  });

  it('should refresh token', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ 
      data: { 
        data: { accessToken: 'new' },
        success: true 
      } 
    });
    
    const res = await authApi.refreshToken('old-refresh');
    
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/refresh-token', {
      refreshToken: 'old-refresh'
    });
    expect(res.data.accessToken).toBe('new');
  });
});
