import { renderHook, waitFor } from '@testing-library/react-native';
import { useNetworkStatus } from './network';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

describe('useNetworkStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch initial network status', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true, type: 'wifi' });
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(() => {});

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionType).toBe('wifi');
    });
  });

  it('should update status when network changes', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true, type: 'wifi' });
    
    let callback: any;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      callback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate network change
    callback({ isConnected: false, type: 'none' });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });
  });
});
