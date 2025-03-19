import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Credential, CredentialFormData, User, UserFormData, PasswordResetData } from '@/types';

interface AuthStore {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // User management actions
  registerUser: (data: UserFormData) => { success: boolean; error?: string };
  loginUser: (username: string, password: string) => { success: boolean; error?: string };
  logoutUser: () => void;
  resetPassword: (data: PasswordResetData) => { success: boolean; error?: string };
  findUserByEmail: (email: string) => User | null;
  findUserByUsername: (username: string) => User | null;
  checkSecurityAnswer: (username: string, answer: string) => boolean;
  
  // Credential management actions
  addCredential: (data: CredentialFormData) => void;
  updateCredential: (id: string, data: Partial<CredentialFormData>) => void;
  deleteCredential: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getCredentials: () => Credential[];
}

// In a real app, we'd encrypt the store with the master password
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      isAuthenticated: false,
      
      registerUser: (data) => {
        const { username, email, password, confirmPassword, securityQuestion, securityAnswer } = data;
        
        // Validate input
        if (password !== confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }
        
        // Check if username or email already exists
        const existingUsername = get().findUserByUsername(username);
        if (existingUsername) {
          return { success: false, error: 'Username already exists' };
        }
        
        const existingEmail = get().findUserByEmail(email);
        if (existingEmail) {
          return { success: false, error: 'Email already exists' };
        }
        
        // Create new user
        const newUser: User = {
          id: uuidv4(),
          username,
          email,
          masterPassword: password, // In a real app, we would hash this
          securityQuestion,
          securityAnswer, // In a real app, we would hash this
          createdAt: new Date(),
          updatedAt: new Date(),
          credentials: []
        };
        
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          isAuthenticated: true
        }));
        
        return { success: true };
      },
      
      loginUser: (username, password) => {
        const user = get().findUserByUsername(username);
        
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        
        // In a real app, we would compare hashed passwords
        if (user.masterPassword !== password) {
          return { success: false, error: 'Invalid password' };
        }
        
        set({
          currentUser: user,
          isAuthenticated: true
        });
        
        return { success: true };
      },
      
      logoutUser: () => {
        set({
          currentUser: null,
          isAuthenticated: false
        });
      },
      
      resetPassword: (data) => {
        const { username, email, securityAnswer, newPassword, confirmPassword } = data;
        
        if (newPassword !== confirmPassword) {
          return { success: false, error: 'Passwords do not match' };
        }
        
        const user = get().findUserByUsername(username);
        
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        
        if (user.email !== email) {
          return { success: false, error: 'Email does not match' };
        }
        
        if (!user.securityAnswer || user.securityAnswer !== securityAnswer) {
          return { success: false, error: 'Incorrect security answer' };
        }
        
        set((state) => ({
          users: state.users.map((u) => 
            u.id === user.id 
              ? { ...u, masterPassword: newPassword, updatedAt: new Date() } 
              : u
          )
        }));
        
        return { success: true };
      },
      
      findUserByEmail: (email) => {
        return get().users.find((user) => user.email === email) || null;
      },
      
      findUserByUsername: (username) => {
        return get().users.find((user) => user.username === username) || null;
      },
      
      checkSecurityAnswer: (username, answer) => {
        const user = get().findUserByUsername(username);
        if (!user || !user.securityAnswer) return false;
        return user.securityAnswer === answer;
      },
      
      addCredential: (data) => {
        if (!get().currentUser) return;
        
        const newCredential: Credential = {
          id: uuidv4(),
          ...data,
          favorite: data.favorite || false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => {
          if (!state.currentUser) return state;
          
          const updatedUser = {
            ...state.currentUser,
            credentials: [...state.currentUser.credentials, newCredential],
            updatedAt: new Date()
          };
          
          return {
            users: state.users.map((u) => 
              u.id === updatedUser.id ? updatedUser : u
            ),
            currentUser: updatedUser
          };
        });
      },
      
      updateCredential: (id, data) => {
        if (!get().currentUser) return;
        
        set((state) => {
          if (!state.currentUser) return state;
          
          const updatedCredentials = state.currentUser.credentials.map((cred) => 
            cred.id === id 
              ? { ...cred, ...data, updatedAt: new Date() } 
              : cred
          );
          
          const updatedUser = {
            ...state.currentUser,
            credentials: updatedCredentials,
            updatedAt: new Date()
          };
          
          return {
            users: state.users.map((u) => 
              u.id === updatedUser.id ? updatedUser : u
            ),
            currentUser: updatedUser
          };
        });
      },
      
      deleteCredential: (id) => {
        if (!get().currentUser) return;
        
        set((state) => {
          if (!state.currentUser) return state;
          
          const updatedCredentials = state.currentUser.credentials.filter(
            (cred) => cred.id !== id
          );
          
          const updatedUser = {
            ...state.currentUser,
            credentials: updatedCredentials,
            updatedAt: new Date()
          };
          
          return {
            users: state.users.map((u) => 
              u.id === updatedUser.id ? updatedUser : u
            ),
            currentUser: updatedUser
          };
        });
      },
      
      toggleFavorite: (id) => {
        if (!get().currentUser) return;
        
        set((state) => {
          if (!state.currentUser) return state;
          
          const updatedCredentials = state.currentUser.credentials.map((cred) => 
            cred.id === id 
              ? { ...cred, favorite: !cred.favorite, updatedAt: new Date() } 
              : cred
          );
          
          const updatedUser = {
            ...state.currentUser,
            credentials: updatedCredentials,
            updatedAt: new Date()
          };
          
          return {
            users: state.users.map((u) => 
              u.id === updatedUser.id ? updatedUser : u
            ),
            currentUser: updatedUser
          };
        });
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