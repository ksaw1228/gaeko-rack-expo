import axios, { AxiosInstance } from 'axios';
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

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Token storage helpers (SecureStore doesn't work on web)
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
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

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
    }
    return Promise.reject(error);
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
