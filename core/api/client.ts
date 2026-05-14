import NetInfo from "@react-native-community/netinfo";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";
import { useAuthStore } from "@/features/auth/store/authStore";
import { RetriableRequestConfig } from "./types";
import { wait, getBackoffTime, isRetryableStatus } from "./utils";
import { trackApiRequest } from "@/core/services/sentryPerformance";

const ACCESS_TOKEN_KEY = "userToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRY_COUNT = 3;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "https://api.freeapi.app";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/users/refresh-token`,
      { refreshToken },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    const refreshedAccessToken = response.data?.data?.accessToken as
      | string
      | undefined;
    const refreshedRefreshToken =
      (response.data?.data?.refreshToken as string | undefined) ?? refreshToken;

    if (!refreshedAccessToken) {
      return null;
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, refreshedAccessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshedRefreshToken);

    useAuthStore.setState({
      token: refreshedAccessToken,
      isAuthenticated: true,
    });
    return refreshedAccessToken;
  } catch {
    return null;
  }
}

async function handleRetry(error: AxiosError, originalRequest: RetriableRequestConfig) {
  const shouldRetry =
    error.code === "ECONNABORTED" ||
    !error.response ||
    isRetryableStatus(error.response?.status);

  if (shouldRetry) {
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (originalRequest._retryCount < MAX_RETRY_COUNT) {
      originalRequest._retryCount += 1;
      await wait(getBackoffTime(originalRequest._retryCount));
      return apiClient(originalRequest);
    }
  }

  if (error.code === "ECONNABORTED") {
    return Promise.reject(new Error("TIMEOUT"));
  }

  return Promise.reject(error);
}


// Request Interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      return Promise.reject(new Error("NO_INTERNET"));
    }

    (config as any).metadata = { startTime: Date.now() };

    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any).metadata?.startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      trackApiRequest(
        response.config.method || 'GET',
        response.config.url || '',
        response.status,
        duration,
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    // Sentry breadcrumb for API errors
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || error.message}`,
      level: 'error',
      data: {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
      },
    });

    if (__DEV__) {
      console.error('============ API ERROR ============');
      console.error('URL:', error.config?.url);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.message);
      console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('===================================');
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.message === "NO_INTERNET") {
      return Promise.reject(error);
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isRefreshRequest = originalRequest.url?.includes(
      "/api/v1/users/refresh-token",
    );

    if (
      error.response?.status === 401 &&
      !isRefreshRequest &&
      !originalRequest._authRetry
    ) {
      originalRequest._authRetry = true;
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(originalRequest);
      }

      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    return handleRetry(error, originalRequest);
  },
);
