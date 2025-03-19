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
  email: string;
  masterPassword: string; // This would be hashed in a real app
  securityQuestion?: string;
  securityAnswer?: string; // This would be hashed in a real app
  createdAt: Date;
  updatedAt: Date;
  credentials: Credential[];
}

export type CredentialFormData = Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'> & {
  favorite?: boolean;
};

export type UserFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  securityQuestion?: string;
  securityAnswer?: string;
};

export type PasswordResetData = {
  username: string;
  email: string;
  securityAnswer: string;
  newPassword: string;
  confirmPassword: string;
}; 