'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { checkPasswordStrength, getPasswordStrengthLabel } from '@/lib/utils';
import type { UserFormData, PasswordResetData } from '@/types';

type AuthTab = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const router = useRouter();
  const { 
    isAuthenticated, 
    loginUser, 
    registerUser, 
    resetPassword,
    twoFactorPending,
    pendingChallengeId,
    pendingUserId,
    completeTwoFactorAuth,
    clearStore,
    deviceRegistrationRequired
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [pendingVerificationCode, setPendingVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Signup form state
  const [signupData, setSignupData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Reset password form state
  const [resetData, setResetData] = useState<PasswordResetData>({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const passwordStrength = checkPasswordStrength(
    activeTab === 'signup' ? signupData.password : 
    activeTab === 'reset' ? resetData.newPassword : ''
  );
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  
  useEffect(() => {
    // If already authenticated, redirect to appropriate page
    if (isAuthenticated) {
      if (deviceRegistrationRequired) {
        router.push('/setup-device');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, deviceRegistrationRequired, router]);
  
  // Clear error when switching tabs
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);
  
  // Handle signup form changes
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    setError('');
  };
  
  // Handle reset form changes
  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData(prev => ({ ...prev, [name]: value }));
    setError('');
  };
  
  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await loginUser(loginUsername, loginPassword);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      if (result.requiresTwoFactor) {
        // Show the verification code form
        setShowVerificationForm(true);
        setPendingVerificationCode(result.verificationCode || '');
        return;
      }
      
      router.push('/dashboard');
    } catch (error) {
      setError('Login failed');
    }
  };

  const handleVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!pendingChallengeId || !pendingUserId) {
        setError('No pending authentication');
        return;
      }

      // Check for a matching challenge
      const response = await fetch(`/api/challenges?userId=${pendingUserId}&code=${verificationCode}`);
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
        return;
      }

      // Complete the authentication
      const authResult = await completeTwoFactorAuth(pendingChallengeId, verificationCode);
      
      if (!authResult.success) {
        setError(authResult.error || 'Verification failed');
        return;
      }
      
      // Clear the verification form
      setShowVerificationForm(false);
      setVerificationCode('');
      setPendingVerificationCode('');
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Please use a stronger password with a mix of letters, numbers, and symbols');
      return;
    }
    
    const result = await registerUser(signupData);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
      return;
    }
    
    // The useEffect will handle the redirection based on deviceRegistrationRequired state
  };
  
  // Handle password reset submission
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Please use a stronger password with a mix of letters, numbers, and symbols');
      return;
    }
    
    const result = await resetPassword(resetData);
    
    if (!result.success) {
      setError(result.error || 'Password reset failed');
      return;
    }
    
    setSuccess('Password reset successful! You can now log in with your new password.');
    setActiveTab('login');
    setLoginUsername(resetData.username);
    setLoginPassword('');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-10 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Secure Password Manager</h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Safely store and manage all your credentials
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 font-medium text-lg ${
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`px-6 py-3 font-medium text-lg ${
              activeTab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
          <button
            className={`px-6 py-3 font-medium text-lg ${
              activeTab === 'reset'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('reset')}
          >
            Reset Password
          </button>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg text-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg text-lg">
            {success}
          </div>
        )}

        {/* Login Form with Verification Code */}
        {activeTab === 'login' && (
          <>
            {showVerificationForm ? (
              <div className="mt-8 space-y-8">
                <div>
                  <label className="block text-xl font-medium text-gray-700 dark:text-gray-300">
                    Enter this code on your registered mobile device:
                  </label>
                  <div className="mt-4">
                    <div className="text-center text-6xl font-bold tracking-wider text-blue-600 dark:text-blue-400 py-6">
                      {pendingVerificationCode}
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 text-center mt-4">
                      Please enter this code on your registered mobile device to complete the login.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-6">
                  <button
                    type="button"
                    onClick={handleVerificationCode}
                    className="flex-1 justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Waiting for mobile verification...
                      </span>
                    ) : (
                      'Check Verification Status'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationForm(false);
                      setLoginPassword('');
                      setPendingVerificationCode('');
                      clearStore();
                    }}
                    className="flex-1 justify-center py-4 px-6 border border-gray-300 rounded-lg shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="mt-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-xl font-medium mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xl font-medium mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="mt-8 space-y-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="signup-username" className="block text-xl font-medium mb-2">
                  Username
                </label>
                <input
                  id="signup-username"
                  name="username"
                  type="text"
                  value={signupData.username}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose a username"
                />
              </div>
              
              <div>
                <label htmlFor="signup-email" className="block text-xl font-medium mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="signup-password" className="block text-xl font-medium mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a strong password"
                />
              </div>
              
              <div>
                <label htmlFor="signup-confirm-password" className="block text-xl font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
        
        {/* Reset Password Form */}
        {activeTab === 'reset' && (
          <form onSubmit={handleReset} className="mt-8 space-y-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="reset-username" className="block text-xl font-medium mb-2">
                  Username
                </label>
                <input
                  id="reset-username"
                  name="username"
                  type="text"
                  value={resetData.username}
                  onChange={handleResetChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label htmlFor="reset-email" className="block text-xl font-medium mb-2">
                  Email
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={resetData.email}
                  onChange={handleResetChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="reset-new-password" className="block text-xl font-medium mb-2">
                  New Password
                </label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  value={resetData.newPassword}
                  onChange={handleResetChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label htmlFor="reset-confirm-password" className="block text-xl font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={handleResetChange}
                  required
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 