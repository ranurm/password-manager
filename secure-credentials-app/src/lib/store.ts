import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Credential, CredentialFormData } from '@/types';

interface CredentialStore {
  credentials: Credential[];
  masterPassword: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setMasterPassword: (password: string) => void;
  authenticate: (password: string) => boolean;
  logout: () => void;
  addCredential: (data: CredentialFormData) => void;
  updateCredential: (id: string, data: Partial<CredentialFormData>) => void;
  deleteCredential: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

// In a real app, we'd encrypt the store with the master password
export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set, get) => ({
      credentials: [],
      masterPassword: null,
      isAuthenticated: false,
      
      setMasterPassword: (password) => {
        // In a real app, we'd hash this password
        set({ masterPassword: password });
      },
      
      authenticate: (password) => {
        const { masterPassword } = get();
        if (masterPassword === password) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ isAuthenticated: false });
      },
      
      addCredential: (data) => {
        const newCredential: Credential = {
          id: uuidv4(),
          ...data,
          favorite: data.favorite || false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          credentials: [...state.credentials, newCredential]
        }));
      },
      
      updateCredential: (id, data) => {
        set((state) => ({
          credentials: state.credentials.map((cred) => 
            cred.id === id 
              ? { ...cred, ...data, updatedAt: new Date() } 
              : cred
          )
        }));
      },
      
      deleteCredential: (id) => {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.id !== id)
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          credentials: state.credentials.map((cred) => 
            cred.id === id 
              ? { ...cred, favorite: !cred.favorite, updatedAt: new Date() } 
              : cred
          )
        }));
      }
    }),
    {
      name: 'credentials-storage',
      // In a real app, we would add encryption here
    }
  )
); 