import { Platform } from 'react-native';

// API base URL - adjust based on platform and environment
// Your computer's local IP - update this if it changes
const LOCAL_IP = '192.168.219.107';

const getApiUrl = () => {
  if (__DEV__) {
    // Development mode - use local IP for physical devices
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:3001/api`;
    } else if (Platform.OS === 'ios') {
      return `http://${LOCAL_IP}:3001/api`;
    } else {
      // Web can use localhost
      return 'http://localhost:3001/api';
    }
  }
  // Production - replace with your actual server URL
  return 'https://your-production-server.com/api';
};

export const API_URL = getApiUrl();

// Get base server URL (without /api)
const getServerUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      return `http://${LOCAL_IP}:3001`;
    } else {
      return 'http://localhost:3001';
    }
  }
  return 'https://your-production-server.com';
};

export const SERVER_URL = getServerUrl();

// Helper to get full image URL from relative path
export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};

// Care threshold days - after this many days without feeding/cleaning, status becomes urgent
export const CARE_THRESHOLD_DAYS = 3;

// App colors
export const COLORS = {
  primary: '#10b981', // emerald-500
  primaryLight: '#d1fae5', // emerald-100
  primaryDark: '#059669', // emerald-600
  danger: '#ef4444', // red-500
  dangerLight: '#fee2e2', // red-100
  warning: '#f59e0b', // amber-500
  background: '#f9fafb', // gray-50
  card: '#ffffff',
  text: '#1f2937', // gray-800
  textSecondary: '#6b7280', // gray-500
  textLight: '#9ca3af', // gray-400
  border: '#e5e7eb', // gray-200
  borderDark: '#d1d5db', // gray-300
};
