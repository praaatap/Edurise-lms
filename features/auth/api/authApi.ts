import { User } from "@/shared/types";
import { apiClient } from "@/core/api/client";

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
  success: boolean;
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken?: string;
  };
  message: string;
  success: boolean;
}

export interface CurrentUserResponse {
  data: User;
  message: string;
  success: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

export const authApi = {
  login: async (data: LoginPayload) => {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/users/login",
      data,
    );
    return response.data;
  },

  register: async (data: RegisterPayload) => {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/users/register",
      data,
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/api/v1/users/refresh-token",
      {
        refreshToken,
      },
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<CurrentUserResponse>(
      "/api/v1/users/current-user",
    );
    return response.data;
  },
};

