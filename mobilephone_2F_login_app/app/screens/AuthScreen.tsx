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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDeviceKeys, signChallenge } from '~/utils/crypto';
import { registerDevice, verifyChallenge } from '~/utils/api';

export default function AuthScreen() {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [code, setCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        await handleRegistration(code);
      } else {
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
      const publicKey = await generateDeviceKeys();
      
      const result = await registerDevice({
        registrationCode,
        deviceName,
        publicKey,
      });

      if (result.success) {
        await AsyncStorage.setItem('deviceId', result.deviceId || '');
        await AsyncStorage.setItem('deviceName', deviceName);
        setIsRegistered(true);
        setIsLoggedIn(true); // Automatically log in after registration
        Alert.alert('Success', 'Device registered and logged in successfully!');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleAuthentication = async (challengeId: string) => {
    try {
      const signature = await signChallenge(challengeId);
      const result = await verifyChallenge({
        challengeId,
        response: signature,
      });

      if (result.success) {
        setIsLoggedIn(true);
        Alert.alert('Success', 'Authentication successful!');
        // Navigate to main app screen or perform other actions
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCode('');
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>You are logged in</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {!isRegistered ? (
          <>
            <Text style={styles.title}>Register Device</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Device Name</Text>
              <TextInput
                style={styles.input}
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="Enter device name"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Registration Code</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCodeSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register Device</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Two-Factor Authentication</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCodeSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
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