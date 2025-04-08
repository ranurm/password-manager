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
  lastUsed: Date;
  createdAt: Date;
  isVerified: boolean;
  registrationCode?: string;
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
  masterPassword: string; // This would be hashed in a real app
  securityQuestion?: string;
  securityAnswer?: string; // This would be hashed in a real app
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastPasswordChangeAt?: Date;
  credentials: Credential[];
  devices: Device[];
  twoFactorEnabled: boolean;
  backupCodes: string[];
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

export interface LoginResponse {
  success: boolean;
  requiresTwoFactor?: boolean;
  error?: string;
  verificationCode?: string;
} 