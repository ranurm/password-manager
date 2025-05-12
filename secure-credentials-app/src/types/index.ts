export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginAttempt {
  id: string;
  username: string;
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
}

export interface Device {
  id: string;
  name: string;
  publicKey: string;
  isVerified: boolean;
  lastUsed: string;
}

export interface AuthenticationChallenge {
  id: string;
  userId: string;
  deviceId: string;
  challenge: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface User {
  id: string;
  username: string;
  email: string;
  twoFactorEnabled: boolean;
  devices: Device[];
  credentials: Credential[];
  createdAt: string;
  lastLoginAt: string;
  lastPasswordChangeAt: string;
  updatedAt: string;
}

export type CredentialFormData = Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'> & {
  favorite?: boolean;
};

export type UserFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type PasswordResetData = {
  username: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
};

export interface LoginResponse {
  success: boolean;
  error?: string;
  requiresTwoFactor?: boolean;
  verificationCode?: string;
  user?: User;
} 