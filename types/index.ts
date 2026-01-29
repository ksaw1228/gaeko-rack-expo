// User types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

// Rack types
export interface Rack {
  id: number;
  name: string;
  rows: number;
  columns: number;
  userId: number;
  geckos: Gecko[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRackData {
  name: string;
  rows: number;
  columns: number;
}

export interface UpdateRackData {
  name?: string;
  rows?: number;
  columns?: number;
}

// Gecko types
export interface Gecko {
  id: number;
  name: string;
  morph?: string;
  birthDate?: string;
  gender: Gender;
  weight?: number;
  notes?: string;
  photoUrl?: string;
  rackId: number;
  row: number;
  column: number;
  careLogs: CareLog[];
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface CreateGeckoData {
  name: string;
  morph?: string;
  birthDate?: string;
  gender?: Gender;
  weight?: number;
  notes?: string;
  rackId: number;
  row: number;
  column: number;
}

export interface UpdateGeckoData {
  name?: string;
  morph?: string;
  birthDate?: string;
  gender?: Gender;
  weight?: number;
  notes?: string;
}

export interface MoveGeckoData {
  rackId: number;
  row: number;
  column: number;
}

// Care Log types
export type CareType = 'FEEDING' | 'CLEANING' | 'SHEDDING' | 'WEIGHT' | 'MATING' | 'LAYING' | 'OTHER';

export interface CareLog {
  id: number;
  type: CareType;
  note?: string;
  value?: string;
  geckoId: number;
  createdAt: string;
}

export interface CreateCareLogData {
  type: CareType;
  note?: string;
  value?: string;
  createdAt?: string;
}

// Photo types
export interface Photo {
  id: number;
  photoUrl: string;
  isMain: boolean;
  takenAt: string;
  geckoId: number;
  createdAt: string;
}

// Cell type for grid
export interface Cell {
  row: number;
  col: number;
  gecko: Gecko | null;
}

// Auth types
export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

// Alert type
export interface Alert {
  id: number;
  type: string;
  message: string;
  geckoId: number;
  gecko: Gecko;
  createdAt: string;
}

// Constants
export const CARE_TYPES: { value: CareType; label: string; icon: string }[] = [
  { value: 'FEEDING', label: '급여', icon: '🍽️' },
  { value: 'CLEANING', label: '청소', icon: '🧹' },
  { value: 'SHEDDING', label: '탈피', icon: '🦎' },
  { value: 'WEIGHT', label: '체중', icon: '⚖️' },
  { value: 'MATING', label: '메이팅', icon: '💕' },
  { value: 'LAYING', label: '산란', icon: '🥚' },
  { value: 'OTHER', label: '기타', icon: '📝' },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'UNKNOWN', label: '미확인' },
];

export const LAYING_OPTIONS = [
  { value: '유정란', label: '유정란' },
  { value: '무정란', label: '무정란' },
  { value: '모르겠음', label: '모르겠음' },
];
