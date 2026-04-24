import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

type EventName = 
  | 'app_open'
  | 'login_success'
  | 'register_success'
  | 'course_view'
  | 'course_enroll'
  | 'course_bookmark'
  | 'ai_chat_open'
  | 'quiz_complete'
  | 'error_occurred';

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async init() {
    if (this.isInitialized) return;
    
    // In a real app, you might initialize Firebase or Segment here
    // For this assignment, we use a custom solution that logs to Sentry and Local Storage
    this.isInitialized = true;
    await this.logEvent('app_open');
  }

  public async logEvent(name: EventName, params?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const eventData = { name, params, timestamp };

    // 1. Log to Console in Dev
    if (__DEV__) {
      console.log(`[Analytics] ${name}:`, params);
    }

    // 2. Track in Sentry as breadcrumbs/events
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: name,
      data: params,
      level: 'info',
    });

    // 3. Persist locally for "Usage Statistics"
    try {
      const logs = await AsyncStorage.getItem('analytics_logs');
      const currentLogs = logs ? JSON.parse(logs) : [];
      const updatedLogs = [eventData, ...currentLogs].slice(0, 100); // Keep last 100 events
      await AsyncStorage.setItem('analytics_logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save analytics event', error);
    }
  }

  public async getRecentEvents() {
    try {
      const logs = await AsyncStorage.getItem('analytics_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      return [];
    }
  }
}

export const analytics = AnalyticsService.getInstance();
