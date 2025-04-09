'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { generateDeviceKeyPair } from '@/lib/crypto';
import type { Device } from '@/types';

export default function DeviceManagement() {
  const router = useRouter();
  const { registerDevice, getDevices, removeDevice, verifyDevice, currentUser } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (currentUser?.devices) {
      setDevices(currentUser.devices);
    }
  }, [currentUser]);

  const loadDevices = async () => {
    const result = await getDevices();
    setDevices(result.devices);
    setTwoFactorEnabled(result.twoFactorEnabled);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newDeviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    try {
      setLoading(true);

      // Generate device keys
      const keyPair = await generateDeviceKeyPair();
      setPublicKey(keyPair.publicKey);

      const result = await registerDevice(newDeviceName, keyPair.publicKey);

      if (!result.success) {
        setError(result.error || 'Failed to register device');
        return;
      }

      if (result.registrationCode) {
        setRegistrationCode(result.registrationCode);
        setSuccess('Device registered successfully! Please enter the verification code in your mobile app.');
        setBackupCodes(result.backupCodes || []);
      } else {
        setError('No registration code received');
      }
    } catch (error) {
      console.error('Add device error:', error);
      setError('Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDevice = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await verifyDevice(
        verificationCode,
        newDeviceName,
        publicKey
      );

      if (result.success) {
        setVerificationCode('');
        setNewDeviceName('');
        setShowAddDevice(false);
        setSuccessMessage('Device verified and logged in successfully!');
        // The store will automatically update the login state
        await loadDevices(); // Refresh the device list
        // Navigate to dashboard after successful verification
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to verify device');
      }
    } catch (error) {
      setError('An error occurred while verifying the device');
      console.error('Verify device error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await removeDevice(deviceId);
      if (!result.success) {
        setError(result.error || 'Failed to remove device');
        return;
      }

      setSuccess('Device removed successfully');
      setDevices(devices.filter(device => device.id !== deviceId));
    } catch (error) {
      setError('Failed to remove device');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the current user's devices
      const result = await getDevices();
      
      // Find any verified device
      const verifiedDevice = result.devices.find(d => d.isVerified);
      
      if (!verifiedDevice) {
        setError('No verified device found. Please complete the verification in your mobile app.');
        return;
      }

      // Device is verified, complete the login using the web-specific endpoint
      const response = await fetch('/api/users/devices/verify-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceName: verifiedDevice.name,
          publicKey: verifiedDevice.publicKey
        }),
      });

      const verifyResult = await response.json();

      if (verifyResult.success) {
        // Update the store with the user data
        useAuthStore.setState({
          currentUser: verifyResult.user,
          isAuthenticated: true,
          deviceRegistrationRequired: false
        });

        setSuccessMessage('2FA device added successfully! You are now logged in.');
        setRegistrationCode('');
        setNewDeviceName('');
        setShowAddDevice(false);
        await loadDevices();
        
        // Navigate to dashboard after successful verification
        router.push('/dashboard');
      } else {
        setError(verifyResult.error || 'Failed to complete login');
      }
    } catch (error) {
      console.error('Check verification error:', error);
      setError('Failed to check device verification status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {twoFactorEnabled
              ? 'Two-factor authentication is enabled. You need at least one registered device.'
              : 'Two-factor authentication is disabled. Add a device to enable it.'}
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
            {success}
          </div>
        )}

        {/* Add New Device Form */}
        {showAddDevice && (
          <form onSubmit={handleAddDevice} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Enter device name"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Device
              </button>
            </div>
          </form>
        )}

        {/* Registration Code Display */}
        {registrationCode && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-blue-500">
            <h3 className="text-lg font-semibold mb-4">Device Registration Code</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md text-center mb-4">
              <span className="text-2xl font-mono tracking-wider">{registrationCode}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter this code in your mobile app to complete the device registration.
              This code will expire in 5 minutes. Do not close this window until you have entered the code.
            </p>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
              <strong>Important:</strong> You must enter this code in your mobile app before proceeding.
              The code will be shown only once and cannot be retrieved later.
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleCheckVerification}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Verify Device'}
              </button>
            </div>
          </div>
        )}

        {/* Device List */}
        {devices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Registered Devices</h3>
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div>
                    <button
                      onClick={() => {
                        setNewDeviceName(device.name);
                        setShowAddDevice(true);
                      }}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {device.name}
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Added on {new Date(device.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 