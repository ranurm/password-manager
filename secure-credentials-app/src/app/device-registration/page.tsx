'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function DeviceRegistrationPage() {
  const router = useRouter();
  const { username, deviceId } = useAuthStore();
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/users/devices/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, deviceId }),
      });

      const data = await response.json();
      if (data.success && data.isVerified) {
        setIsRegistered(true);
        // Automatically redirect to dashboard when verified
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Device Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the registration code shown on your mobile device
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="registration-code" className="sr-only">
                Registration Code
              </label>
              <input
                id="registration-code"
                name="registration-code"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter registration code"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={checkRegistrationStatus}
              className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Check Status
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 