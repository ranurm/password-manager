import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  deviceName: string | null;
  setUserId: (userId: string) => void;
  setDeviceName: (deviceName: string) => void;
  verifyUser: (code: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  deviceName: null,
  setUserId: (userId: string) => {
    set({ userId });
    AsyncStorage.setItem('userId', userId);
  },
  setDeviceName: (deviceName: string) => {
    set({ deviceName });
    AsyncStorage.setItem('deviceName', deviceName);
  },
  verifyUser: async (code: string) => {
    try {
      // This is a placeholder - in a real app, you would verify with your backend
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  },
}));

// Load persisted state on startup
AsyncStorage.getItem('userId').then((userId) => {
  if (userId) {
    useAuthStore.getState().setUserId(userId);
  }
});

AsyncStorage.getItem('deviceName').then((deviceName) => {
  if (deviceName) {
    useAuthStore.getState().setDeviceName(deviceName);
  }
}); 