import NetInfo from "@react-native-community/netinfo";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/features/auth/store/authStore";

const ACCESS_TOKEN_KEY = "userToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRY_COUNT = 3;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  _authRetry?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffTime(retryCount: number) {
  return Math.pow(2, retryCount - 1) * 1000;
}

function isRetryableStatus(status?: number) {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
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

// Request Interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      return Promise.reject(new Error("NO_INTERNET"));
    }

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
  (response) => response,
  async (error: AxiosError) => {
    // Log API errors only in development builds — never in production
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
      "/auth/refresh",
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
  },
);
