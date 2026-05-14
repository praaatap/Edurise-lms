import * as RNClarity from 'react-native-clarity';

interface ClarityUser {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
}

// Clarity limits: event name ≤ 254 chars, tag key/value ≤ 255 chars, non-empty
const trim = (v: string, max = 255): string => String(v).trim().slice(0, max) || '_';

class ClarityService {
  private static instance: ClarityService;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  private constructor() {}

  static getInstance(): ClarityService {
    if (!ClarityService.instance) {
      ClarityService.instance = new ClarityService();
    }
    return ClarityService.instance;
  }

  initialize() {
    // Guard: never initialize twice — double-init resets Clarity session state
    if (this._isInitialized) {
      if (__DEV__) console.warn('[Clarity] Already initialized — skipping duplicate call');
      return;
    }

    const projectId = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) {
      if (__DEV__) console.warn('[Clarity] No project ID configured');
      return;
    }

    // Register session callback BEFORE initialize so it fires on the first session
    RNClarity.setOnSessionStartedCallback((sessionId) => {
      if (__DEV__) console.log('[Clarity] ✔ Session started:', sessionId);
    });

    RNClarity.initialize(projectId);
    this._isInitialized = true;
    if (__DEV__) console.log('[Clarity] ✔ Initialized — project ID:', projectId);
  }

  setScreen(screenName: string) {
    if (!this._isInitialized) {
      if (__DEV__) console.warn('[Clarity] setScreen called before initialize():', screenName);
      return;
    }
    RNClarity.setCurrentScreenName(trim(screenName));
    if (__DEV__) console.log('[Clarity] → screen:', screenName);
  }

  identifyUser(user: ClarityUser) {
    if (!this._isInitialized) return;
    RNClarity.setCustomUserId(trim(user._id));
    if (user.username) RNClarity.setCustomTag('username', trim(user.username));
    if (user.email) RNClarity.setCustomTag('email', trim(user.email));
    if (user.role) RNClarity.setCustomTag('role', trim(user.role));
    if (__DEV__) console.log('[Clarity] → user identified:', user._id, user.username);
  }

  clearUser() {
    if (!this._isInitialized) return;
    RNClarity.startNewSession((_sessionId) => {
      if (__DEV__) console.log('[Clarity] → user cleared, new anonymous session');
    });
  }

  // Called by analyticsService for every logEvent — sends BOTH a named event
  // AND individual key/value tags so each param is independently filterable
  // in the Clarity dashboard.
  logCustomEvent(name: string, params?: Record<string, any>) {
    if (!this._isInitialized) return;

    const eventName = trim(name, 254);
    RNClarity.sendCustomEvent(eventName);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const tagKey = trim(`${eventName}_${key}`);
        const tagVal = trim(String(value));
        RNClarity.setCustomTag(tagKey, tagVal);
      }
      RNClarity.setCustomTag('last_event', eventName);
    }

    if (__DEV__) console.log('[Clarity] → event:', eventName, params ?? '');
  }
}

export const clarityService = ClarityService.getInstance();
