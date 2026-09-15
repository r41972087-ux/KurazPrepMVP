import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  stream: 'NATURAL' | 'SOCIAL';
  gradeLevel: number; // 11 or 12
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isGuest: boolean;
  selectedStream: 'NATURAL' | 'SOCIAL';
  selectedGrade: number; // 11 or 12

  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  continueAsGuest: () => void;
  setStream: (stream: 'NATURAL' | 'SOCIAL') => void;
  setGrade: (grade: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isGuest: true, // Default to guest browsing mode
  selectedStream: 'NATURAL',
  selectedGrade: 12,

  setAuth: (token, user) =>
    set({
      token,
      user,
      isGuest: false,
      selectedStream: user.stream || 'NATURAL',
      selectedGrade: user.gradeLevel || 12,
    }),

  logout: () =>
    set({
      token: null,
      user: null,
      isGuest: true,
    }),

  continueAsGuest: () =>
    set({
      token: null,
      user: null,
      isGuest: true,
    }),

  setStream: (stream) => set({ selectedStream: stream }),
  setGrade: (grade) => set({ selectedGrade: grade }),
}));
