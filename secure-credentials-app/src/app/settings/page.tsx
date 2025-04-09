'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import DeviceList from '@/components/DeviceList';
import DeviceManagement from '@/components/DeviceManagement';
import { Device } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, deviceRegistrationRequired, getDevices, removeDevice } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeviceRegistration, setShowDeviceRegistration] = useState(false);

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

    // Load devices
    loadDevices();
  }, [isAuthenticated, deviceRegistrationRequired, router]);

  const loadDevices = async () => {
    try {
      const result = await getDevices();
      setDevices(result.devices);
    } catch (error) {
      setError('Failed to load devices');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      // Check if this is the last device
      if (devices.length <= 1) {
        setError('Cannot remove the last registered device');
        return;
      }

      const result = await removeDevice(deviceId);
      
      if (!result.success) {
        setError(result.error || 'Failed to remove device');
        return;
      }

      setSuccess('Device removed successfully');
      setError('');
      loadDevices(); // Refresh the device list
    } catch (error) {
      setError('Failed to remove device');
    }
  };

  if (!isAuthenticated || deviceRegistrationRequired) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      <div className="space-y-8">
        {/* Device Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Device Management</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Manage your registered devices. You must have at least one registered device.
            </p>
            <button
              onClick={() => setShowDeviceRegistration(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Register New Device
            </button>
          </div>

          {showDeviceRegistration ? (
            <div className="mt-6">
              <DeviceManagement />
            </div>
          ) : (
            <DeviceList onRemoveDevice={handleRemoveDevice} />
          )}
        </div>
      </div>
    </div>
  );
} 