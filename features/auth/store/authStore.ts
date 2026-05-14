import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi, LoginPayload, RegisterPayload } from "@/features/auth/api/authApi";
import { User } from "@/shared/types";
import { analytics } from "@/core/services/analyticsService";
import { clarityService } from "@/core/services/clarityService";
import { withSentrySpan, trackUserAction } from "@/core/services/sentryPerformance";
import * as Sentry from "@sentry/react-native";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  setLocalAvatar: (uri: string) => void;
  localAvatar: string | null;
}

const ACCESS_TOKEN_KEY = "userToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      localAvatar: null,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await withSentrySpan('user-login', 'auth.login', () => authApi.login(credentials));
          await SecureStore.setItemAsync(
            ACCESS_TOKEN_KEY,
            res.data.accessToken,
          );
          await SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            res.data.refreshToken,
          );
          set({
            user: res.data.user,
            token: res.data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          Sentry.setUser({ id: res.data.user._id, email: res.data.user.email, username: res.data.user.username });
          clarityService.identifyUser(res.data.user);
          clarityService.logEvent('login_success', { role: res.data.user.role ?? 'user' });
          analytics.logEvent('login_success', { userId: res.data.user._id });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await withSentrySpan('user-register', 'auth.register', () => authApi.register(data));
          // Auto login after successful registration
          await useAuthStore.getState().login({
            email: data.email,
            password: data.password,
          });
          clarityService.logEvent('register_success');
          analytics.logEvent('register_success');
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        trackUserAction('logout');
        clarityService.logEvent('logout');
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        Sentry.setUser(null);
        clarityService.clearUser();
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
          if (token) {
            // Token exists — validate it and fetch a fresh user profile
            try {
              const userRes = await withSentrySpan('check-auth', 'auth.checkAuth', () => authApi.getCurrentUser());
              Sentry.setUser({ id: userRes.data._id, email: userRes.data.email, username: userRes.data.username });
              set({ token, user: userRes.data, isAuthenticated: true, isLoading: false });
            } catch {
              // Token may be expired — try refresh flow
              const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
              if (refreshToken) {
                try {
                  const refreshRes = await withSentrySpan('token-refresh', 'auth.refresh', () => authApi.refreshToken(refreshToken));
                  const nextAccessToken = refreshRes.data.accessToken;
                  const nextRefreshToken = refreshRes.data.refreshToken ?? refreshToken;
                  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, nextAccessToken);
                  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefreshToken);
                  const userRes = await withSentrySpan('check-auth-after-refresh', 'auth.checkAuth', () => authApi.getCurrentUser());
                  Sentry.setUser({ id: userRes.data._id, email: userRes.data.email, username: userRes.data.username });
                  set({ token: nextAccessToken, user: userRes.data, isAuthenticated: true, isLoading: false });
                  return;
                } catch {
                  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
                  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                }
              }
              set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
            return;
          }

          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const refreshRes = await withSentrySpan('token-refresh', 'auth.refresh', () => authApi.refreshToken(refreshToken));
              const nextAccessToken = refreshRes.data.accessToken;
              const nextRefreshToken = refreshRes.data.refreshToken ?? refreshToken;
              await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, nextAccessToken);
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefreshToken);
              const userRes = await withSentrySpan('check-auth-after-refresh', 'auth.checkAuth', () => authApi.getCurrentUser());
              Sentry.setUser({ id: userRes.data._id, email: userRes.data.email, username: userRes.data.username });
              set({ token: nextAccessToken, user: userRes.data, isAuthenticated: true, isLoading: false });
              return;
            } catch {
              await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            }
          }

          set({ token: null, isAuthenticated: false, isLoading: false });
        } catch {
          set({ token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      setLocalAvatar: (uri: string) => set({ localAvatar: uri }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, localAvatar: state.localAvatar }), // Persist localAvatar safely
    },
  ),
);
