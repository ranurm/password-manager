'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import type { Device } from '@/types';

interface DeviceListProps {
  onRemoveDevice?: (deviceId: string) => Promise<void>;
}

export default function DeviceList({ onRemoveDevice }: DeviceListProps) {
  const { getDevices, removeDevice } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

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
      if (onRemoveDevice) {
        await onRemoveDevice(deviceId);
      } else {
        const result = await removeDevice(deviceId);
        
        if (!result.success) {
          setError(result.error || 'Failed to remove device');
          return;
        }

        setSuccess('Device removed successfully');
        setError('');
        loadDevices();
      }
    } catch (error) {
      setError('Failed to remove device');
    }
  };

  if (devices.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400">No devices registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div>
              <h3 className="font-medium">{device.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Added: {new Date(device.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last used: {new Date(device.lastUsed).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleRemoveDevice(device.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 