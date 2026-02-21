const API_BASE_URL = 'http://localhost:8081/api';

// Types for API requests
export type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  nickname?: string;
  aboutMe?: string;
  avatar?: string; // Base64 encoded image
};

export type LoginData = {
  email: string;
  password: string;
};

export type UserResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  aboutMe: string;
  avatar: string;
  isPrivate: boolean;
  dateOfBirth: string;
  createdAt: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string | { message: string; fields: Record<string, string> };
};

// Generic fetch wrapper with credentials included
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // CRITICAL: Include cookies in requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// Auth API functions
export const authApi = {
  register: (data: RegisterData) =>
    request<UserResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginData) =>
    request<UserResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<null>('/logout', {
      method: 'POST',
    }),

  getMe: () => request<UserResponse>('/me'),
};

export default authApi;

