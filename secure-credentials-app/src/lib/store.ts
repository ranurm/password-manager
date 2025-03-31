import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Credential, CredentialFormData, User, UserFormData, PasswordResetData } from '@/types';

interface AuthStore {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // User management actions
  registerUser: (data: UserFormData) => Promise<{ success: boolean; error?: string }>;
  loginUser: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  resetPassword: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>;
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserByUsername: (username: string) => Promise<User | null>;
  checkSecurityAnswer: (username: string, answer: string) => Promise<boolean>;
  
  // Credential management actions
  addCredential: (data: CredentialFormData) => Promise<void>;
  updateCredential: (id: string, data: Partial<CredentialFormData>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getCredentials: () => Credential[];
}

// In a real app, we'd encrypt the store with the master password
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      isAuthenticated: false,
      
      registerUser: async (data) => {
        const { username, email, password, confirmPassword, securityQuestion, securityAnswer } = data;
        
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
              masterPassword: password,
              securityQuestion,
              securityAnswer
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          set({
            currentUser: result.user,
            isAuthenticated: true
          });
          
          return { success: true };
        } catch (error) {
          console.error('Registration error:', error);
          return { success: false, error: 'Registration failed' };
        }
      },
      
      loginUser: async (username, password) => {
        try {
          const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`);
          const result = await response.json();
          
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          if (result.user.masterPassword !== password) {
            return { success: false, error: 'Invalid password' };
          }
          
          set({
            currentUser: result.user,
            isAuthenticated: true
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
        const { username, email, securityAnswer, newPassword, confirmPassword } = data;
        
        if (newPassword !== confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }
        
        try {
          const response = await fetch('/api/users/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              email,
              securityAnswer,
              newPassword
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            return { success: false, error: result.error };
          }
          
          set({
            currentUser: result.user,
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
      
      checkSecurityAnswer: async (username, answer) => {
        try {
          const response = await fetch(`/api/users/check-security-answer?username=${encodeURIComponent(username)}&answer=${encodeURIComponent(answer)}`);
          const result = await response.json();
          
          return result.success;
        } catch (error) {
          console.error('Check security answer error:', error);
          return false;
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
        return currentUser ? currentUser.credentials : [];
      }
    }),
    {
      name: 'auth-storage',
      // In a real app, we would add encryption here
    }
  )
);

// For backward compatibility with existing code
export const useCredentialStore = useAuthStore; 