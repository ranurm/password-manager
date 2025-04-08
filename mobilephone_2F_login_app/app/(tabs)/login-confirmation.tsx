import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { checkLoginConfirmations, respondToLoginConfirmation } from '~/utils/api';

export default function LoginConfirmationScreen() {
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    checkForConfirmations();
    const interval = setInterval(checkForConfirmations, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkForConfirmations = async () => {
    try {
      const result = await checkLoginConfirmations();
      if (result.success && result.confirmationId) {
        setConfirmation({
          id: result.confirmationId,
          status: result.status,
        });
      }
    } catch (error) {
      console.error('Error checking confirmations:', error);
    }
  };

  const handleResponse = async (approved: boolean) => {
    if (!confirmation) return;

    try {
      setLoading(true);
      const result = await respondToLoginConfirmation(confirmation.id, approved);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Login ${approved ? 'approved' : 'rejected'} successfully`
        );
        setConfirmation(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to respond to login request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to login request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!confirmation) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Pending Login Requests</Text>
        <Text style={styles.subtitle}>Waiting for login attempts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Request</Text>
      <Text style={styles.message}>
        A login attempt has been detected. Would you like to approve it?
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleResponse(true)}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleResponse(false)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
}); 