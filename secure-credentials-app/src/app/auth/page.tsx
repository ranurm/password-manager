'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCredentialStore } from '@/lib/store';
import { checkPasswordStrength, getPasswordStrengthLabel } from '@/lib/utils';

export default function AuthPage() {
  const router = useRouter();
  const { masterPassword, isAuthenticated, setMasterPassword, authenticate } = useCredentialStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const passwordStrength = checkPasswordStrength(password);
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  
  useEffect(() => {
    // Check if this is a new user (no master password set yet)
    setIsNewUser(masterPassword === null);
    
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [masterPassword, isAuthenticated, router]);
  
  const handleSetupPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Please use a stronger password with a mix of letters, numbers, and symbols');
      return;
    }
    
    setMasterPassword(password);
    authenticate(password);
    router.push('/dashboard');
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authenticate(password)) {
      router.push('/dashboard');
    } else {
      setError('Incorrect master password');
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {isNewUser ? 'Set Up Your Password Manager' : 'Unlock Your Password Manager'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isNewUser 
              ? 'Create a strong master password to secure all your credentials'
              : 'Enter your master password to access your credentials'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={isNewUser ? handleSetupPassword : handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your master password"
              />
              
              {isNewUser && password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Strength: {strengthLabel}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        passwordStrength === 0 ? 'bg-red-500 w-1/5' :
                        passwordStrength === 1 ? 'bg-orange-500 w-2/5' :
                        passwordStrength === 2 ? 'bg-yellow-500 w-3/5' :
                        passwordStrength === 3 ? 'bg-lime-500 w-4/5' : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {isNewUser && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm Master Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your master password"
                />
              </div>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isNewUser ? 'Create Master Password' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 