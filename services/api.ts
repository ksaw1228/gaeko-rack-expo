import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from '../constants/config';
import type {
  User,
  Rack,
  Gecko,
  CareLog,
  Photo,
  Alert,
  CreateRackData,
  UpdateRackData,
  CreateGeckoData,
  UpdateGeckoData,
  MoveGeckoData,
  CreateCareLogData,
  LoginResponse,
  RegisterResponse,
} from '../types';

const TOKEN_KEY = 'auth_token';

// Custom error class for API errors
export class ApiError extends Error {
  public status?: number;
  public isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

// Sanitize error message to avoid exposing internal details
const sanitizeErrorMessage = (error: AxiosError): string => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
    }
    return '네트워크 연결을 확인해주세요.';
  }

  // Server error response
  const status = error.response.status;
  const data = error.response.data as { message?: string; error?: string } | undefined;

  // Only show user-friendly messages from server
  if (data?.message && typeof data.message === 'string' && data.message.length < 200) {
    // Filter out technical error messages
    if (!data.message.includes('Error:') && !data.message.includes('TypeError')) {
      return data.message;
    }
  }

  // Generic messages based on status code
  switch (status) {
    case 400:
      return '잘못된 요청입니다.';
    case 401:
      return '로그인이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 데이터를 찾을 수 없습니다.';
    case 409:
      return '중복된 데이터가 존재합니다.';
    case 500:
    default:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for slower connections
});

// Safe localStorage access for web
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // localStorage not available (e.g., private browsing)
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // localStorage not available
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // localStorage not available
    }
  },
};

// Token storage helpers (SecureStore doesn't work on web)
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return safeLocalStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    safeLocalStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    safeLocalStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 - unauthorized
    if (error.response?.status === 401) {
      await removeToken();
    }

    // Create sanitized error
    const message = sanitizeErrorMessage(error);
    const isNetworkError = !error.response;
    const apiError = new ApiError(message, error.response?.status, isNetworkError);

    return Promise.reject(apiError);
  }
);

// Auth API
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  await setToken(res.data.token);
  return res.data;
};

export const register = async (email: string, password: string, name: string): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/auth/register', { email, password, name });
  await setToken(res.data.token);
  return res.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};

export const logout = async (): Promise<void> => {
  await removeToken();
};

export const hasToken = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

// Rack API
export const getRacks = async (): Promise<Rack[]> => {
  const res = await api.get<Rack[]>('/racks');
  return res.data;
};

export const getRack = async (id: number): Promise<Rack> => {
  const res = await api.get<Rack>(`/racks/${id}`);
  return res.data;
};

export const createRack = async (data: CreateRackData): Promise<Rack> => {
  const res = await api.post<Rack>('/racks', data);
  return res.data;
};

export const updateRack = async (id: number, data: UpdateRackData): Promise<Rack> => {
  const res = await api.put<Rack>(`/racks/${id}`, data);
  return res.data;
};

export const deleteRack = async (id: number): Promise<void> => {
  await api.delete(`/racks/${id}`);
};

// Gecko API
export const getGeckos = async (): Promise<Gecko[]> => {
  const res = await api.get<Gecko[]>('/geckos');
  return res.data;
};

export const getGecko = async (id: number): Promise<Gecko> => {
  const res = await api.get<Gecko>(`/geckos/${id}`);
  return res.data;
};

export const createGecko = async (data: CreateGeckoData): Promise<Gecko> => {
  const res = await api.post<Gecko>('/geckos', data);
  return res.data;
};

export const updateGecko = async (id: number, data: UpdateGeckoData): Promise<Gecko> => {
  const res = await api.put<Gecko>(`/geckos/${id}`, data);
  return res.data;
};

export const moveGecko = async (id: number, data: MoveGeckoData): Promise<Gecko> => {
  const res = await api.patch<Gecko>(`/geckos/${id}/move`, data);
  return res.data;
};

export const swapGeckos = async (geckoId1: number, geckoId2: number): Promise<{ gecko1: Gecko; gecko2: Gecko }> => {
  const res = await api.post<{ gecko1: Gecko; gecko2: Gecko }>('/geckos/swap', { geckoId1, geckoId2 });
  return res.data;
};

export const deleteGecko = async (id: number): Promise<void> => {
  await api.delete(`/geckos/${id}`);
};

// Photo API (legacy - single photo)
export const uploadGeckoPhoto = async (geckoId: number, uri: string, fileName: string, type: string): Promise<Gecko> => {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: fileName,
    type,
  } as any);

  const res = await api.post<Gecko>(`/geckos/${geckoId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteGeckoPhoto = async (geckoId: number): Promise<void> => {
  await api.delete(`/geckos/${geckoId}/photo`);
};

// Photo Gallery API (multiple photos)
export const getGeckoPhotos = async (geckoId: number): Promise<Photo[]> => {
  const res = await api.get<Photo[]>(`/geckos/${geckoId}/photos`);
  return res.data;
};

export const uploadGeckoPhotoWithDate = async (
  geckoId: number,
  uri: string,
  fileName: string,
  type: string,
  takenAt?: string
): Promise<Photo> => {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: fileName,
    type,
  } as any);
  if (takenAt) {
    formData.append('takenAt', takenAt);
  }

  const res = await api.post<Photo>(`/geckos/${geckoId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const setMainPhoto = async (photoId: number): Promise<Photo> => {
  const res = await api.patch<Photo>(`/photos/${photoId}/main`);
  return res.data;
};

export const deletePhoto = async (photoId: number): Promise<void> => {
  await api.delete(`/photos/${photoId}`);
};

// Care Log API
export const getGeckoLogs = async (geckoId: number): Promise<CareLog[]> => {
  const res = await api.get<CareLog[]>(`/geckos/${geckoId}/logs`);
  return res.data;
};

export const createCareLog = async (geckoId: number, data: CreateCareLogData): Promise<CareLog> => {
  const res = await api.post<CareLog>(`/geckos/${geckoId}/logs`, data);
  return res.data;
};

export const deleteCareLog = async (id: number): Promise<void> => {
  await api.delete(`/logs/${id}`);
};

// Alerts API
export const getAlerts = async (): Promise<Alert[]> => {
  const res = await api.get<Alert[]>('/alerts');
  return res.data;
};

export default api;
