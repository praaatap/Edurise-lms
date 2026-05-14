import * as RNClarity from 'react-native-clarity';
import { LogLevel } from 'react-native-clarity';
import { Platform } from 'react-native';

interface ClarityUser {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
}

// Clarity limits: tag key/value ≤ 255 chars, event name ≤ 254 chars, non-empty
const trim = (v: string, max = 255): string => String(v).trim().slice(0, max) || '_';

// All custom events fired in the app — single source of truth
export type ClarityEvent =
  // Auth
  | 'login_success'
  | 'login_failed'
  | 'register_success'
  | 'logout'
  // Courses
  | 'course_viewed'
  | 'course_enrolled'
  | 'course_unenrolled'
  | 'course_completed'
  | 'course_bookmarked'
  | 'course_unbookmarked'
  | 'course_content_opened'
  | 'course_content_progress'
  | 'course_note_saved'
  | 'course_shared'
  | 'course_searched'
  | 'course_filter_applied'
  // AI
  | 'ai_chat_opened'
  | 'ai_message_sent'
  | 'ai_image_attached'
  | 'ai_recommendation_tapped'
  // Profile
  | 'profile_avatar_changed'
  | 'theme_changed'
  | 'biometric_toggled'
  | 'app_icon_changed'
  | 'notification_preference_changed'
  // Navigation
  | 'tab_switched'
  | 'instructor_profile_viewed'
  // Engagement
  | 'quiz_completed'
  | 'streak_updated'
  | 'bookmark_milestone_reached';

class ClarityService {
  private static instance: ClarityService;
  private _isInitialized = false;
  private _pendingUser: ClarityUser | null = null;
  private _sessionUrl: string | null = null;

  get isInitialized(): boolean { return this._isInitialized; }
  get sessionUrl(): string | null { return this._sessionUrl; }

  private constructor() {}

  static getInstance(): ClarityService {
    if (!ClarityService.instance) {
      ClarityService.instance = new ClarityService();
    }
    return ClarityService.instance;
  }

  initialize() {
    if (this._isInitialized) {
      if (__DEV__) console.warn('[Clarity] Already initialized — skipping');
      return;
    }

    const projectId = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) {
      if (__DEV__) console.warn('[Clarity] No project ID — set EXPO_PUBLIC_CLARITY_PROJECT_ID in .env');
      return;
    }

    // Grant consent BEFORE initialize so recording starts immediately without waiting
    RNClarity.consent(true, true);

    // Register session callback BEFORE initialize — fires on the very first session
    RNClarity.setOnSessionStartedCallback((sessionId) => {
      RNClarity.getCurrentSessionUrl().then((url) => {
        if (url) {
          this._sessionUrl = url;
          if (__DEV__) {
            console.log('');
            console.log('╔══════════════════════════════════════════════════════════╗');
            console.log('║  🎥 CLARITY SESSION RECORDING STARTED                    ║');
            console.log(`║  ID  : ${String(sessionId).padEnd(50)}║`);
            console.log(`║  URL : ${String(url).slice(0, 50).padEnd(50)}║`);
            console.log('╚══════════════════════════════════════════════════════════╝');
            console.log('');
          }
        }
      });

      // Tag device/platform info once per session
      RNClarity.setCustomTag('platform', Platform.OS);
      RNClarity.setCustomTag('platform_version', String(Platform.Version));
      RNClarity.setCustomTag('env', __DEV__ ? 'development' : 'production');

      // Apply queued user identity
      if (this._pendingUser) {
        this._applyUser(this._pendingUser, String(sessionId));
        this._pendingUser = null;
      }
    });

    RNClarity.initialize(projectId, {
      logLevel: __DEV__ ? LogLevel.Verbose : LogLevel.None,
    });

    this._isInitialized = true;
    if (__DEV__) console.log('[Clarity] ✔ Initialized — project:', projectId);
  }

  // ─── User Identity ──────────────────────────────────────────────────────────

  private _applyUser(user: ClarityUser, sessionId?: string) {
    RNClarity.setCustomUserId(trim(user._id));
    // Use user ID as custom session ID so you can search by user in dashboard
    if (sessionId) RNClarity.setCustomSessionId(trim(user._id));
    if (user.username) RNClarity.setCustomTag('username', trim(user.username));
    if (user.email)    RNClarity.setCustomTag('user_email', trim(user.email));
    if (user.role)     RNClarity.setCustomTag('user_role', trim(user.role));
    if (__DEV__) console.log('[Clarity] → user applied:', user._id, user.username);
  }

  identifyUser(user: ClarityUser) {
    if (!this._isInitialized) return;
    RNClarity.getCurrentSessionUrl().then((url) => {
      if (url) {
        this._applyUser(user);
      } else {
        // Session not yet active — queue for callback
        this._pendingUser = user;
        if (__DEV__) console.log('[Clarity] → user queued for session start:', user._id);
      }
    });
  }

  clearUser() {
    if (!this._isInitialized) return;
    this._pendingUser = null;
    // Start fresh anonymous session on logout
    RNClarity.startNewSession((sessionId) => {
      this._sessionUrl = null;
      RNClarity.setCustomTag('platform', Platform.OS);
      RNClarity.setCustomTag('env', __DEV__ ? 'development' : 'production');
      RNClarity.getCurrentSessionUrl().then((url) => {
        if (url) {
          this._sessionUrl = url;
          if (__DEV__) console.log('[Clarity] → anonymous session URL:', url);
        }
      });
      if (__DEV__) console.log('[Clarity] → new anonymous session:', sessionId);
    });
  }

  // ─── Screen Tracking ────────────────────────────────────────────────────────

  setScreen(screenName: string) {
    if (!this._isInitialized) return;
    RNClarity.setCurrentScreenName(trim(screenName));
    if (__DEV__) console.log('[Clarity] → screen:', screenName);
  }

  // ─── Custom Events ──────────────────────────────────────────────────────────

  // Primary method — send a named event + tag all params individually
  logEvent(name: ClarityEvent, params?: Record<string, string | number | boolean>) {
    if (!this._isInitialized) return;
    const eventName = trim(name, 254);
    RNClarity.sendCustomEvent(eventName);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        RNClarity.setCustomTag(trim(`${eventName}_${key}`), trim(String(value)));
      }
    }
    // Always tag the last fired event so you can filter sessions by latest action
    RNClarity.setCustomTag('last_event', eventName);
    if (__DEV__) console.log('[Clarity] → event:', eventName, params ?? '');
  }

  // ─── Recording Control ──────────────────────────────────────────────────────

  // Call on screens with sensitive input (login/register password fields)
  pauseRecording() {
    if (!this._isInitialized) return;
    RNClarity.pause();
    if (__DEV__) console.log('[Clarity] ⏸ Recording paused');
  }

  resumeRecording() {
    if (!this._isInitialized) return;
    RNClarity.resume();
    if (__DEV__) console.log('[Clarity] ▶ Recording resumed');
  }

  // ─── Session URL ────────────────────────────────────────────────────────────

  async getSessionUrl(): Promise<string | null> {
    if (!this._isInitialized) return null;
    const url = await RNClarity.getCurrentSessionUrl();
    if (url) this._sessionUrl = url;
    return url ?? null;
  }

  // Legacy method kept for analyticsService compatibility
  logCustomEvent(name: string, params?: Record<string, any>) {
    if (!this._isInitialized) return;
    const eventName = trim(name, 254);
    RNClarity.sendCustomEvent(eventName);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        RNClarity.setCustomTag(trim(`${eventName}_${key}`), trim(String(value)));
      }
      RNClarity.setCustomTag('last_event', eventName);
    }
    if (__DEV__) console.log('[Clarity] → event:', eventName, params ?? '');
  }
}

export const clarityService = ClarityService.getInstance();
