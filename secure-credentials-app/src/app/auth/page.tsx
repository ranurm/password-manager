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
    completeTwoFactorAuth,
    verifyBackupCode
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
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodeForm, setShowBackupCodeForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Signup form state
  const [signupData, setSignupData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  
  // Reset password form state
  const [resetData, setResetData] = useState<PasswordResetData>({
    username: '',
    email: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const passwordStrength = checkPasswordStrength(
    activeTab === 'signup' ? signupData.password : 
    activeTab === 'reset' ? resetData.newPassword : ''
  );
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  
  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
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
      if (!pendingChallengeId) {
        setError('No pending authentication');
        return;
      }

      const result = await completeTwoFactorAuth(pendingChallengeId, verificationCode);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
        return;
      }
      
      router.push('/dashboard');
    } catch (error) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await verifyBackupCode(backupCode);
    
    if (!result.success) {
      setError(result.error || 'Invalid backup code');
      return;
    }
    
    router.push('/dashboard');
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
    
    if (!signupData.securityQuestion || !signupData.securityAnswer) {
      setError('Security question and answer are required for account recovery');
      return;
    }
    
    const result = await registerUser(signupData);
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
      return;
    }
    
    // Redirect to device setup instead of dashboard
    router.push('/setup-device');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Secure Password Manager</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Safely store and manage all your credentials
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
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
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded text-sm">
            {success}
          </div>
        )}

        {/* Login Form with Verification Code */}
        {activeTab === 'login' && (
          <>
            {showVerificationForm ? (
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter this code on your registered mobile device:
                  </label>
                  <div className="mt-1">
                    <div className="text-center text-4xl font-bold tracking-wider text-blue-600 dark:text-blue-400 py-4">
                      {pendingVerificationCode}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                      Please enter this code on your registered mobile device to complete the login.
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleVerificationCode}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Waiting for mobile verification...
                      </span>
                    ) : (
                      'Check Verification Status'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Login
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('reset')} 
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="mt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="signup-username"
                  name="username"
                  type="text"
                  value={signupData.username}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose a username"
                />
              </div>
              
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a strong password"
                />
                
                {signupData.password && (
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
              
              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
              
              <div>
                <label htmlFor="security-question" className="block text-sm font-medium mb-1">
                  Security Question
                </label>
                <select
                  id="security-question"
                  name="securityQuestion"
                  value={signupData.securityQuestion}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a security question</option>
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="security-answer" className="block text-sm font-medium mb-1">
                  Security Answer
                </label>
                <input
                  id="security-answer"
                  name="securityAnswer"
                  type="text"
                  value={signupData.securityAnswer}
                  onChange={handleSignupChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used to recover your account if you forget your password.
                </p>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
        
        {/* Reset Password Form */}
        {activeTab === 'reset' && (
          <form onSubmit={handleReset} className="mt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="reset-username"
                  name="username"
                  type="text"
                  value={resetData.username}
                  onChange={handleResetChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                />
              </div>
              
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={resetData.email}
                  onChange={handleResetChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="reset-security-answer" className="block text-sm font-medium mb-1">
                  Security Answer
                </label>
                <input
                  id="reset-security-answer"
                  name="securityAnswer"
                  type="text"
                  value={resetData.securityAnswer}
                  onChange={handleResetChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your security answer"
                />
              </div>
              
              <div>
                <label htmlFor="reset-new-password" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  value={resetData.newPassword}
                  onChange={handleResetChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
                
                {resetData.newPassword && (
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
              
              <div>
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={handleResetChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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