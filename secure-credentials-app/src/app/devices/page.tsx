'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import DeviceList from '@/components/DeviceList';

export default function DevicesPage() {
  const router = useRouter();
  const { isAuthenticated, deviceRegistrationRequired } = useAuthStore();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // If device registration is required, redirect to setup-device
    if (deviceRegistrationRequired) {
      router.push('/setup-device');
      return;
    }
  }, [isAuthenticated, deviceRegistrationRequired, router]);

  if (!isAuthenticated || deviceRegistrationRequired) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Registered Devices</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DeviceList />
      </div>
    </div>
  );
} 