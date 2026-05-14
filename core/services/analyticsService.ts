import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { clarityService } from './clarityService';

type EventName =
  | 'app_open'
  | 'login_success'
  | 'register_success'
  // Home
  | 'home_refresh'
  | 'home_instructor_tapped'
  | 'home_error_retry'
  // Courses
  | 'course_tapped'
  | 'course_view'
  | 'course_enroll'
  | 'course_unenroll'
  | 'course_bookmark'
  | 'course_note_added'
  | 'course_ai_recommendations_loaded'
  // Filters & Search
  | 'search_performed'
  | 'filter_category_selected'
  | 'filter_level_selected'
  | 'filter_price_selected'
  | 'filter_sort_applied'
  | 'filter_sheet_opened'
  | 'filter_reset'
  | 'filter_applied'
  // Bookmarks
  | 'bookmarks_course_long_pressed'
  | 'bookmarks_course_shared'
  | 'bookmarks_course_removed'
  | 'bookmarks_explore_tapped'
  // Course Detail
  | 'course_detail_shared'
  | 'course_detail_tab_switched'
  | 'course_detail_description_expanded'
  | 'course_detail_download_all'
  | 'course_detail_module_downloaded'
  | 'course_detail_see_all_reviews'
  | 'course_detail_certificate_viewed'
  | 'course_detail_enroll_sheet_opened'
  | 'course_detail_unenrolled'
  | 'course_detail_content_started'
  // Course Content
  | 'course_content_back'
  | 'course_content_note_opened'
  | 'course_content_note_saved'
  | 'course_content_note_discarded'
  | 'course_content_completed'
  | 'course_content_error_retry'
  // AI
  | 'ai_chat_open'
  | 'ai_message_sent'
  | 'ai_response_received'
  | 'ai_tool_called'
  | 'ai_smart_search'
  | 'ai_error'
  // Quiz
  | 'quiz_complete'
  // Profile & Settings
  | 'theme_changed'
  | 'biometric_toggled'
  | 'profile_image_updated'
  | 'notification_toggled'
  | 'app_icon_changed'
  | 'profile_logout'
  | 'streak_updated'
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

    // 3. Send to Microsoft Clarity
    clarityService.logCustomEvent(name, params);

    // 4. Persist locally for "Usage Statistics"
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
