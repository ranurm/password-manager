import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Credential, CredentialFormData, User, UserFormData, PasswordResetData, Device, LoginResponse } from '@/types';

interface AuthStore {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  twoFactorPending: boolean;
  pendingUserId: string | null;
  pendingDeviceId: string | null;
  pendingChallengeId: string | null;
  deviceRegistrationRequired: boolean;
  
  // User management actions
  registerUser: (data: UserFormData) => Promise<{ success: boolean; error?: string }>;
  loginUser: (username: string, password: string) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean; verificationCode?: string }>;
  completeTwoFactorAuth: (challengeId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  resetPassword: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>;
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserByUsername: (username: string) => Promise<User | null>;
  
  // Device management actions
  registerDevice: (deviceName: string, publicKey: string) => Promise<{ 
    success: boolean; 
    device?: Device; 
    registrationCode?: string;
    backupCodes?: string[]; 
    error?: string; 
  }>;
  getDevices: () => Promise<{ devices: Device[]; twoFactorEnabled: boolean }>;
  removeDevice: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Credential management actions
  addCredential: (data: CredentialFormData) => Promise<void>;
  updateCredential: (id: string, data: Partial<CredentialFormData>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getCredentials: () => Credential[];

  // New functions
  verifyDevice: (registrationCode: string, deviceName: string, publicKey: string) => Promise<{ success: boolean; error?: string; deviceId?: string }>;
  clearStore: () => void;
}

// In a real app, we'd encrypt the store with the master password
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      isAuthenticated: false,
      twoFactorPending: false,
      pendingUserId: null,
      pendingDeviceId: null,
      pendingChallengeId: null,
      deviceRegistrationRequired: true,
      
      registerUser: async (data) => {
        const { username, email, password, confirmPassword } = data;
        
        if (password !== confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }
        
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: uuidv4(),
              username,
              email,
              masterPassword: password
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          set({
            currentUser: result.user,
            isAuthenticated: true,
            deviceRegistrationRequired: true,
            twoFactorPending: false,
            pendingUserId: null,
            pendingDeviceId: null,
            pendingChallengeId: null
          });
          
          return { success: true };
        } catch (error) {
          console.error('Registration error:', error);
          return { success: false, error: 'Registration failed' };
        }
      },
      
      loginUser: async (username, password) => {
        try {
          const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });

          const result = await response.json();
          
          if (!result.success) {
            return { success: false, error: result.error };
          }

          // If 2FA is enabled, create a challenge
          if (result.user.twoFactorEnabled) {
            const challengeResponse = await fetch('/api/users/auth-challenge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: result.user.id,
                deviceId: result.user.devices?.[0]?.id
              })
            });

            const challengeResult = await challengeResponse.json();
            
            if (!challengeResult.success) {
              return { success: false, error: challengeResult.error };
            }

            // Store the pending authentication state
            set({
              twoFactorPending: true,
              pendingUserId: result.user.id,
              pendingDeviceId: result.user.devices?.[0]?.id,
              pendingChallengeId: challengeResult.challengeId
            });
            
            // Return the verification code to display to the user
            return { 
              success: true, 
              requiresTwoFactor: true,
              verificationCode: challengeResult.verificationCode
            };
          }
          
          // If no 2FA, complete login immediately
          set({
            currentUser: result.user,
            isAuthenticated: true,
            twoFactorPending: false,
            pendingUserId: null,
            pendingDeviceId: null,
            pendingChallengeId: null
          });
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'Login failed' };
        }
      },
      
      logoutUser: () => {
        set({
          currentUser: null,
          isAuthenticated: false
        });
      },
      
      resetPassword: async (data) => {
        const { username, email, newPassword, confirmPassword } = data;
        
        if (newPassword !== confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }
        
        try {
          // First verify the user exists
          const userResponse = await fetch(`/api/users?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
          const userResult = await userResponse.json();
          
          if (!userResult.success) {
            return { success: false, error: userResult.error };
          }
          
          // If 2FA is enabled, initiate the challenge
          if (userResult.user.twoFactorEnabled) {
            // Get the user's most recently used device
            const devices = userResult.user.devices || [];
            if (devices.length === 0) {
              return { success: false, error: 'No registered devices found' };
            }
            
            const lastUsedDevice = devices.reduce((prev: Device | null, curr: Device) => 
              (!prev || new Date(curr.lastUsed) > new Date(prev.lastUsed)) ? curr : prev
            , null);
            
            if (!lastUsedDevice) {
              return { success: false, error: 'No registered devices found' };
            }
            
            // Create an authentication challenge
            const challengeResponse = await fetch('/api/challenges', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userResult.user.id,
                deviceName: lastUsedDevice.name
              })
            });
            
            const challengeResult = await challengeResponse.json();
            if (!challengeResult.success) {
              return { success: false, error: challengeResult.error };
            }
            
            // Store pending authentication state
            set({
              twoFactorPending: true,
              pendingUserId: userResult.user.id,
              pendingDeviceId: lastUsedDevice.id,
              pendingChallengeId: challengeResult.challengeId
            });
            
            // Return the verification code to display to the user
            return { 
              success: true, 
              requiresTwoFactor: true,
              verificationCode: challengeResult.verificationCode
            };
          }
          
          // If no 2FA, complete password reset immediately
          const resetResponse = await fetch('/api/users/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              email,
              newPassword
            })
          });
          
          const resetResult = await resetResponse.json();
          
          if (!resetResult.success) {
            return { success: false, error: resetResult.error };
          }
          
          set({
            currentUser: resetResult.user,
            isAuthenticated: true
          });
          
          return { success: true };
        } catch (error) {
          console.error('Reset password error:', error);
          return { success: false, error: 'Password reset failed' };
        }
      },
      
      findUserByEmail: async (email) => {
        try {
          const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
          const result = await response.json();
          
          if (!result.success) {
            return null;
          }
          
          return result.user;
        } catch (error) {
          console.error('Find user by email error:', error);
          return null;
        }
      },
      
      findUserByUsername: async (username) => {
        try {
          const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`);
          const result = await response.json();
          
          if (!result.success) {
            return null;
          }
          
          return result.user;
        } catch (error) {
          console.error('Find user by username error:', error);
          return null;
        }
      },
      
      completeTwoFactorAuth: async (challengeId, code) => {
        try {
          // Check if the challenge has been approved by the mobile device
          const statusResponse = await fetch(`/api/challenges?challengeId=${challengeId}&code=${code}`);
          const statusResult = await statusResponse.json();
          
          if (!statusResult.success) {
            return { success: false, error: statusResult.error };
          }
          
          if (statusResult.status !== 'approved') {
            return { success: false, error: 'Verification not yet approved by mobile device' };
          }
          
          // Get the user data
          const userResponse = await fetch(`/api/users?id=${get().pendingUserId}`);
          const userResult = await userResponse.json();
          
          if (!userResult.success) {
            return { success: false, error: userResult.error };
          }
          
          // Complete the login
          set({
            currentUser: userResult.user,
            isAuthenticated: true,
            twoFactorPending: false,
            pendingUserId: null,
            pendingDeviceId: null,
            pendingChallengeId: null
          });
          
          return { success: true };
        } catch (error) {
          console.error('Complete 2FA error:', error);
          return { success: false, error: 'Failed to complete two-factor authentication' };
        }
      },
      
      registerDevice: async (deviceName, publicKey) => {
        try {
          const { currentUser, pendingUserId } = get();
          const userId = currentUser?.id || pendingUserId;
          
          if (!userId) {
            return { success: false, error: 'No user ID found for device registration' };
          }
          
          const response = await fetch('/api/users/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              deviceName,
              publicKey
            })
          });
          
          const result = await response.json();
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          // Don't update the current user's devices yet - wait for verification
          return { 
            success: true,
            registrationCode: result.registrationCode,
            backupCodes: result.backupCodes
          };
        } catch (error) {
          console.error('Device registration error:', error);
          return { success: false, error: 'Failed to register device' };
        }
      },
      
      verifyDevice: async (registrationCode, deviceName, publicKey) => {
        try {
          const response = await fetch('/api/users/devices/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationCode,
              deviceName,
              publicKey
            })
          });
          
          const result = await response.json();
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          // If verification is successful, update the store with the user data
          if (result.user) {
            set({
              currentUser: result.user,
              isAuthenticated: true,
              twoFactorPending: false,
              pendingUserId: null,
              pendingDeviceId: null,
              pendingChallengeId: null,
              deviceRegistrationRequired: false
            });
          }
          
          return { 
            success: true,
            deviceId: result.deviceId
          };
        } catch (error) {
          console.error('Device verification error:', error);
          return { success: false, error: 'Failed to verify device' };
        }
      },
      
      getDevices: async () => {
        try {
          const { currentUser } = get();
          if (!currentUser) {
            return { devices: [], twoFactorEnabled: false };
          }
          
          const response = await fetch(`/api/users/devices?userId=${currentUser.id}`);
          const result = await response.json();
          
          if (!result.success) {
            console.error('Get devices error:', result.error);
            return { devices: [], twoFactorEnabled: false };
          }
          
          return {
            devices: result.devices,
            twoFactorEnabled: result.twoFactorEnabled
          };
        } catch (error) {
          console.error('Get devices error:', error);
          return { devices: [], twoFactorEnabled: false };
        }
      },
      
      removeDevice: async (deviceId) => {
        try {
          const { currentUser } = get();
          if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
          }
          
          const response = await fetch(`/api/users/devices?userId=${currentUser.id}&deviceId=${deviceId}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          // Update the current user by removing the device
          set((state) => ({
            currentUser: state.currentUser ? {
              ...state.currentUser,
              devices: state.currentUser.devices?.filter(d => d.id !== deviceId) || [],
              twoFactorEnabled: (state.currentUser.devices?.length || 0) > 1
            } : null
          }));
          
          return { success: true };
        } catch (error) {
          console.error('Remove device error:', error);
          return { success: false, error: 'Failed to remove device' };
        }
      },
      
      addCredential: async (data) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        try {
          const response = await fetch('/api/users/add-credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              credential: data
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Add credential error:', result.error);
            return;
          }
          
          set((state) => {
            if (!state.currentUser) return state;
            
            const updatedUser = {
              ...state.currentUser,
              credentials: [...state.currentUser.credentials, result.credential],
              updatedAt: new Date()
            };
            
            return {
              currentUser: updatedUser
            };
          });
        } catch (error) {
          console.error('Add credential error:', error);
        }
      },
      
      updateCredential: async (id, data) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        try {
          const response = await fetch('/api/users/update-credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              credentialId: id,
              data: data
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Update credential error:', result.error);
            return;
          }
          
          set((state) => {
            if (!state.currentUser) return state;
            
            const updatedCredentials = state.currentUser.credentials.map((cred) => 
              cred.id === id 
                ? { ...cred, ...data, updatedAt: new Date() } 
                : cred
            );
            
            return {
              currentUser: {
                ...state.currentUser,
                credentials: updatedCredentials,
                updatedAt: new Date()
              }
            };
          });
        } catch (error) {
          console.error('Update credential error:', error);
        }
      },
      
      deleteCredential: async (id) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        try {
          const response = await fetch('/api/users/delete-credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              credentialId: id
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Delete credential error:', result.error);
            return;
          }
          
          set((state) => {
            if (!state.currentUser) return state;
            
            return {
              currentUser: {
                ...state.currentUser,
                credentials: state.currentUser.credentials.filter(cred => cred.id !== id),
                updatedAt: new Date()
              }
            };
          });
        } catch (error) {
          console.error('Delete credential error:', error);
        }
      },
      
      toggleFavorite: async (id) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        try {
          const response = await fetch('/api/users/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              credentialId: id
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Toggle favorite error:', result.error);
            return;
          }
          
          set((state) => {
            if (!state.currentUser) return state;
            
            return {
              currentUser: {
                ...state.currentUser,
                credentials: state.currentUser.credentials.map(cred => 
                  cred.id === id 
                    ? { ...cred, favorite: !cred.favorite, updatedAt: new Date() } 
                    : cred
                ),
                updatedAt: new Date()
              }
            };
          });
        } catch (error) {
          console.error('Toggle favorite error:', error);
        }
      },
      
      getCredentials: () => {
        const { currentUser } = get();
        return currentUser?.credentials || [];
      },
      
      clearStore: () => {
        set({
          users: [],
          currentUser: null,
          isAuthenticated: false,
          twoFactorPending: false,
          pendingUserId: null,
          pendingDeviceId: null,
          pendingChallengeId: null,
          deviceRegistrationRequired: true
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        deviceRegistrationRequired: state.deviceRegistrationRequired
      })
    }
  )
);

// For backward compatibility with existing code
export const useCredentialStore = useAuthStore; 