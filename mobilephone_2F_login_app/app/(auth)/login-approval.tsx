import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';

export default function LoginApprovalScreen() {
  const router = useRouter();
  const { challenge, ipAddress, timestamp, location, deviceInfo } = useLocalSearchParams<{
    challenge: string;
    ipAddress: string;
    timestamp: string;
    location?: string;
    deviceInfo?: string;
  }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, approveLoginRequest } = useAuth();
  
  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to device registration
      Alert.alert(
        'Device Not Registered',
        'This device is not registered. Please register it first.',
        [
          {
            text: 'Register Device',
            onPress: () => router.push("/(auth)/register-device"),
          },
        ]
      );
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);
  
  // Handle login approval
  const handleApproval = async (approved: boolean) => {
    try {
      const signature = await approveLoginRequest(challenge);
      const result = await verifyChallenge({
        challengeId: challenge,
        response: signature,
      });

      if (result.success) {
        Alert.alert('Success', 'Login request approved!');
        router.push("/");
      } else {
        throw new Error(result.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Approval failed');
    }
  };
  
  // Handle login denial
  const handleDeny = () => {
    Alert.alert('Denied', 'Login request denied.');
    router.push("/");
  };
  
  // Format date for display
  const formatDate = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      return date.toLocaleString();
    } catch (e) {
      return timestampStr;
    }
  };
  
  // Make sure we have required params
  if (!challenge || !ipAddress || !timestamp) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Invalid Request' }} />
        <Text style={styles.errorTitle}>
          Invalid Login Request
        </Text>
        <Text style={styles.errorText}>
          This login request is missing required information. Please try again.
        </Text>
      </View>
    );
  }
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Login Request' }} />
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Login Request' }} />
      <Text style={styles.title}>
        Login Request
      </Text>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.subtitle}>Login Attempt Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{formatDate(timestamp)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>IP Address:</Text>
          <Text style={styles.detailValue}>{ipAddress}</Text>
        </View>
        
        {location ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{location}</Text>
          </View>
        ) : null}
        
        {deviceInfo ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Device:</Text>
            <Text style={styles.detailValue}>{deviceInfo}</Text>
          </View>
        ) : null}
      </View>
      
      <Text style={styles.warning}>
        Only approve this request if you are trying to log in.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.denyButton]} 
          onPress={handleDeny}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Deny</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.approveButton]} 
          onPress={() => handleApproval(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  detailsContainer: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    color: '#666',
    maxWidth: '60%',
    textAlign: 'right',
  },
  warning: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButton: {
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  approveButton: {
    backgroundColor: '#0a7ea4',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 