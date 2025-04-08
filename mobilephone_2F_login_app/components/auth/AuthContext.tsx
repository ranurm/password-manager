import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for our context
type Device = {
  id: string;
  name: string;
  dateAdded: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  registeredDevices: Device[];
  currentDevice: Device | null;
  registerDevice: (name: string) => Promise<string>;
  removeDevice: (deviceId: string) => Promise<void>;
  verifyDeviceRegistration: (code: string) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  approveLoginRequest: (challenge: string) => Promise<string>;
  logout: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  registeredDevices: [],
  currentDevice: null,
  registerDevice: async () => '',
  removeDevice: async () => {},
  verifyDeviceRegistration: async () => false,
  authenticateWithBiometrics: async () => false,
  approveLoginRequest: async () => '',
  logout: async () => {},
});

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredDevices, setRegisteredDevices] = useState<Device[]>([]);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if device is already registered
        const storedDeviceId = await SecureStore.getItemAsync('deviceId');
        const storedDevices = await AsyncStorage.getItem('registeredDevices');
        
        if (storedDeviceId) {
          // Load registered devices
          if (storedDevices) {
            const devices = JSON.parse(storedDevices) as Device[];
            setRegisteredDevices(devices);
            
            // Find current device in the list
            const device = devices.find(d => d.id === storedDeviceId) || null;
            setCurrentDevice(device);
            
            // Consider the user authenticated if we have a registered device
            setIsAuthenticated(!!device);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register a new device
  const registerDevice = async (name: string): Promise<string> => {
    try {
      // Generate a unique device ID
      const deviceId = Crypto.randomUUID();
      
      // Create device object
      const newDevice: Device = {
        id: deviceId,
        name,
        dateAdded: new Date().toISOString(),
      };
      
      // Add to registered devices
      const updatedDevices = [...registeredDevices, newDevice];
      setRegisteredDevices(updatedDevices);
      setCurrentDevice(newDevice);
      
      // Store in secure storage
      await SecureStore.setItemAsync('deviceId', deviceId);
      await AsyncStorage.setItem('registeredDevices', JSON.stringify(updatedDevices));
      
      // Generate a private key for this device (for signing challenges)
      // Since we can't use actual keypairs in this demo, we'll generate a random string as a "private key"
      const privateKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${deviceId}_${Date.now()}_${Math.random()}`
      );
      await SecureStore.setItemAsync(`privateKey_${deviceId}`, privateKey);
      
      setIsAuthenticated(true);
      return deviceId;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  };

  // Remove a device
  const removeDevice = async (deviceId: string): Promise<void> => {
    try {
      const updatedDevices = registeredDevices.filter(device => device.id !== deviceId);
      setRegisteredDevices(updatedDevices);
      
      // If we're removing the current device, log out
      if (currentDevice?.id === deviceId) {
        await logout();
      } else {
        await AsyncStorage.setItem('registeredDevices', JSON.stringify(updatedDevices));
      }
      
      // Remove device keys
      await SecureStore.deleteItemAsync(`privateKey_${deviceId}`);
    } catch (error) {
      console.error('Error removing device:', error);
      throw error;
    }
  };

  // Verify device registration code
  const verifyDeviceRegistration = async (code: string): Promise<boolean> => {
    try {
      // In a real implementation, this would validate the code with your backend
      // For demo purposes, accept any 6-digit code
      // You should replace this with actual validation logic
      
      // For testing, let's accept code "123456" as valid
      return code === "123456";
    } catch (error) {
      console.error('Error verifying device registration:', error);
      return false;
    }
  };

  // Authenticate using biometrics
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      if (!hasHardware) {
        console.log('Device does not have biometric hardware');
        return false;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isEnrolled) {
        console.log('No biometrics enrolled on this device');
        return false;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use passcode',
      });
      
      return result.success;
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return false;
    }
  };

  // Approve a login request
  const approveLoginRequest = async (challenge: string): Promise<string> => {
    try {
      if (!currentDevice) {
        throw new Error('No device registered');
      }
      
      // Require biometric authentication before approving
      const isAuthenticated = await authenticateWithBiometrics();
      
      if (!isAuthenticated) {
        throw new Error('Biometric authentication failed');
      }
      
      // Get the private key for signing
      const privateKey = await SecureStore.getItemAsync(`privateKey_${currentDevice.id}`);
      
      if (!privateKey) {
        throw new Error('Private key not found');
      }
      
      // Sign the challenge
      // In a real implementation, this would use proper cryptographic signing
      // For this demo, we're just creating a digest
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${challenge}_${privateKey}`
      );
      
      return signature;
    } catch (error) {
      console.error('Error approving login request:', error);
      throw error;
    }
  };

  // Log out
  const logout = async (): Promise<void> => {
    try {
      setIsAuthenticated(false);
      setCurrentDevice(null);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('deviceId');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        registeredDevices,
        currentDevice,
        registerDevice,
        removeDevice,
        verifyDeviceRegistration,
        authenticateWithBiometrics,
        approveLoginRequest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 