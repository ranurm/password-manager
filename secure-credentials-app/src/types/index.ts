export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  favorite: boolean;
}

export interface User {
  id: string;
  username: string;
  masterPassword: string; // This would be hashed in a real app
  credentials: Credential[];
}

export type CredentialFormData = Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'> & {
  favorite?: boolean;
}; 