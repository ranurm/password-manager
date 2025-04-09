import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { router } from 'expo-router';

// Replace with your actual server URL
const API_URL = 'http://your-server-url:3000';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId, deviceName, verifyUser } = useAuthStore();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    if (!userId || !deviceName) {
      Alert.alert('Error', 'User ID or device name not found');
      return;
    }

    setLoading(true);
    try {
      // Create challenge in database
      const challengeResponse = await fetch(`${API_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceName,
          code,
        }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }

      // Wait for the web app to verify the challenge
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = 2000; // 2 seconds

      while (attempts < maxAttempts) {
        const verifyResponse = await fetch(
          `${API_URL}/api/challenges?userId=${userId}&code=${code}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || 'Failed to verify challenge');
        }

        const verifyData = await verifyResponse.json();
        if (verifyData.success) {
          Alert.alert('Success', 'Verification successful');
          router.replace('/');
          return;
        }

        // If not verified yet, wait and try again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        attempts++;
      }

      throw new Error('Verification timed out. Please try again.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Enter Verification Code
        </Text>
        <Text className="text-center mb-8 text-gray-600 dark:text-gray-300">
          Please enter the 6-digit code shown on your web browser
        </Text>
        
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 text-center text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter code"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg"
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
} 