import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

interface RegisterDeviceParams {
  registrationCode: string;
  deviceName: string;
  publicKey: string;
}

interface VerifyChallengeParams {
  challengeId: string;
  response: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  deviceId?: string;
}

export async function registerDevice(params: RegisterDeviceParams): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/users/devices/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Register device error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function verifyChallenge(params: VerifyChallengeParams): Promise<ApiResponse> {
  try {
    const deviceId = await AsyncStorage.getItem('deviceId');
    const userId = await AsyncStorage.getItem('userId');

    const response = await fetch(`${API_URL}/users/auth-challenge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        deviceId,
        userId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verify challenge error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function checkPendingChallenges(): Promise<ApiResponse> {
  try {
    const deviceId = await AsyncStorage.getItem('deviceId');
    const userId = await AsyncStorage.getItem('userId');

    if (!deviceId || !userId) {
      return { success: false, error: 'Device not registered' };
    }

    const response = await fetch(
      `${API_URL}/users/auth-challenge/pending?deviceId=${deviceId}&userId=${userId}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Check pending challenges error:', error);
    return { success: false, error: 'Network error' };
  }
} 