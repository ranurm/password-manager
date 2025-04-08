import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';

export default function RegisterDeviceScreen() {
  const [deviceName, setDeviceName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { registerDevice, verifyDeviceRegistration } = useAuth();

  // Handle registration form submission
  const handleRegister = async () => {
    try {
      if (!deviceName.trim()) {
        Alert.alert('Error', 'Please enter a device name');
        return;
      }

      if (!verificationCode.trim() || verificationCode.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit verification code');
        return;
      }

      setIsRegistering(true);
      
      // Verify the code
      const isValid = await verifyDeviceRegistration(verificationCode);
      
      if (!isValid) {
        Alert.alert('Invalid Code', 'The verification code is invalid or expired.');
        setIsRegistering(false);
        return;
      }
      
      // Register the device
      await registerDevice(deviceName);
      
      // Navigate to home screen on success
      router.replace('/');
    } catch (error) {
      console.error('Error registering device:', error);
      Alert.alert('Registration Failed', 'Failed to register your device. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Register Device' }} />
      <Text style={styles.title}>Register Your Device</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Device Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My iPhone"
          value={deviceName}
          onChangeText={setDeviceName}
          autoCapitalize="none"
        />
        
        <View style={styles.codeContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            maxLength={6}
            keyboardType="number-pad"
          />
          <Text style={styles.codeHint}>
            Enter the 6-digit code displayed on your web app
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.registerButton,
            (!deviceName || !verificationCode || verificationCode.length !== 6 || isRegistering) && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={!deviceName || !verificationCode || verificationCode.length !== 6 || isRegistering}
        >
          {isRegistering ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.registerButtonText}>Register Device</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.helpText}>
        To register your device, enter a name for it and the 6-digit verification code displayed on the web app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeHint: {
    fontSize: 14,
    color: '#666',
    marginTop: -8,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 