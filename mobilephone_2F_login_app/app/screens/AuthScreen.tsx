import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDeviceKeys, signChallenge } from '~/utils/crypto';
import { registerDevice, verifyChallenge } from '~/utils/api';

interface AuthData {
  type: 'registration' | 'authentication';
  userId?: string;
  token?: string;
  challengeId?: string;
}

export default function AuthScreen() {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    checkDeviceRegistration();
  }, []);

  useEffect(() => {
    if (!isRegistered) {
      AsyncStorage.getItem('deviceName').then((name) => {
        if (name) setDeviceName(name);
      });
    }
  }, [isRegistered]);

  const checkDeviceRegistration = async () => {
    const deviceId = await AsyncStorage.getItem('deviceId');
    setIsRegistered(!!deviceId);
  };

  const handleCodeSubmit = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      if (!isRegistered) {
        // For registration, use the code directly
        await handleRegistration(code);
      } else {
        // For authentication, use the code as challenge ID
        await handleAuthentication(code);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process code');
    } finally {
      setLoading(false);
      setCode('');
    }
  };

  const handleRegistration = async (registrationCode: string) => {
    try {
      if (!deviceName.trim()) {
        Alert.alert('Error', 'Please enter a device name');
        return;
      }

      const publicKey = await generateDeviceKeys();
      const result = await registerDevice({
        registrationCode,
        deviceName,
        publicKey,
      });

      if (result.success) {
        await AsyncStorage.setItem('deviceId', result.deviceId!);
        await AsyncStorage.setItem('deviceName', deviceName);
        setIsRegistered(true);
        Alert.alert('Success', 'Device registered successfully');
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to register device');
    }
  };

  const handleAuthentication = async (challengeId: string) => {
    try {
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use device PIN',
      });

      if (!biometricResult.success) {
        Alert.alert('Error', 'Authentication failed');
        return;
      }

      const signature = await signChallenge(challengeId);
      const result = await verifyChallenge({
        challengeId,
        response: signature,
      });

      if (result.success) {
        Alert.alert('Success', 'Authentication approved');
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {isRegistered ? '2FA Authentication' : 'Device Registration'}
        </Text>
        
        {!isRegistered && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Device Name</Text>
            <TextInput
              style={styles.input}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="Enter device name"
              placeholderTextColor="#666"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {isRegistered ? 'Enter Authentication Code' : 'Enter Registration Code'}
          </Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, code.length !== 6 && styles.buttonDisabled]}
          onPress={handleCodeSubmit}
          disabled={code.length !== 6}
        >
          <Text style={styles.buttonText}>
            {isRegistered ? 'Authenticate' : 'Register Device'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  codeInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
}); 