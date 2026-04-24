import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi, LoginPayload, RegisterPayload } from "@/features/auth/api/authApi";
import { User } from "@/shared/types";

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

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(credentials);
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
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await authApi.register(data);
          // Auto login after successful registration
          await useAuthStore.getState().login({
            email: data.email,
            password: data.password,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
          if (token) {
            set({ token, isAuthenticated: true, isLoading: false });
            return;
          } else {
            const refreshToken =
              await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              try {
                const refreshRes = await authApi.refreshToken(refreshToken);
                const nextAccessToken = refreshRes.data.accessToken;
                const nextRefreshToken =
                  refreshRes.data.refreshToken ?? refreshToken;

                await SecureStore.setItemAsync(
                  ACCESS_TOKEN_KEY,
                  nextAccessToken,
                );
                await SecureStore.setItemAsync(
                  REFRESH_TOKEN_KEY,
                  nextRefreshToken,
                );

                set({
                  token: nextAccessToken,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } catch {
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
              }
            }

            set({ token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user info, token is in SecureStore
    },
  ),
);
