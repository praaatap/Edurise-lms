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

function mapBackendUser(raw: any): User {
  return {
    _id: raw.id ?? raw._id,
    username: raw.username ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
    email: raw.email,
    avatar: raw.avatarUrl ? { url: raw.avatarUrl, localPath: '' } : { url: '', localPath: '' },
    role: (raw.role?.toLowerCase() === 'instructor' ? 'teacher' : raw.role?.toLowerCase()) as User['role'],
    isEmailVerified: raw.isEmailVerified ?? true,
    bio: raw.bio,
    schoolId: raw.schoolId,
  };
}

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    const raw = response.data;
    return {
      ...raw,
      data: {
        ...raw.data,
        user: mapBackendUser(raw.data.user),
      },
    };
  },

  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const [firstName, ...rest] = data.username.split(' ');
    const lastName = rest.join(' ') || firstName;
    const response = await apiClient.post("/auth/register", {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      username: data.username,
      role: data.role === 'teacher' ? 'INSTRUCTOR' : data.role.toUpperCase(),
    });
    const raw = response.data;
    return {
      ...raw,
      data: {
        ...raw.data,
        user: mapBackendUser(raw.data.user),
      },
    };
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await apiClient.get("/users/me");
    const raw = response.data;
    return {
      ...raw,
      data: mapBackendUser(raw.data),
    };
  },
};
