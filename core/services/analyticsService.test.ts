import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './analyticsService';
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue('[]'),
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log events to sentry and storage', async () => {
    await analytics.logEvent('app_open', { foo: 'bar' });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'analytics',
      message: 'app_open',
      level: 'info',
      data: { foo: 'bar' }
    });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
