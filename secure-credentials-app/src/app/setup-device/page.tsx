'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import DeviceManagement from '@/components/DeviceManagement';

export default function SetupDevicePage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, deviceRegistrationRequired } = useAuthStore();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // If device registration is not required, redirect to dashboard
    if (!deviceRegistrationRequired) {
      router.push('/dashboard');
      return;
    }

    // If user already has 2FA enabled, redirect to dashboard
    if (currentUser?.twoFactorEnabled) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, currentUser, deviceRegistrationRequired, router]);

  if (!isAuthenticated || !currentUser || !deviceRegistrationRequired) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Set Up Two-Factor Authentication</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To enhance the security of your account, you need to set up two-factor authentication
            before accessing the dashboard. This is a one-time setup process.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Please add a device using the form below. You'll receive a registration code that
            you'll need to enter in the mobile app to complete the setup.
          </p>
        </div>

        <DeviceManagement />
      </div>
    </div>
  );
} 