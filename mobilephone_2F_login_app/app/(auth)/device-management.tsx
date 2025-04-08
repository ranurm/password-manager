import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';

export default function DeviceManagementScreen() {
  const router = useRouter();
  const { isAuthenticated, registeredDevices, currentDevice, removeDevice } = useAuth();
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  
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
    }
  }, [isAuthenticated, router]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Handle device removal
  const handleRemoveDevice = async (deviceId: string) => {
    // Don't allow removing the current device
    if (deviceId === currentDevice?.id) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove the current device. Please use another device to remove this one.'
      );
      return;
    }
    
    // Confirm removal
    Alert.alert(
      'Remove Device',
      'Are you sure you want to remove this device? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingDeviceId(deviceId);
              await removeDevice(deviceId);
              Alert.alert('Success', 'Device removed successfully');
            } catch (error) {
              console.error('Error removing device:', error);
              Alert.alert('Error', 'Failed to remove device. Please try again.');
            } finally {
              setRemovingDeviceId(null);
            }
          },
        },
      ]
    );
  };
  
  // Render device item
  const renderDeviceItem = ({ item }: { item: typeof registeredDevices[number] }) => {
    const isCurrentDevice = item.id === currentDevice?.id;
    
    return (
      <View style={styles.deviceItem}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.dateText}>
            Added on {formatDate(item.dateAdded)}
          </Text>
          
          {isCurrentDevice && (
            <Text style={styles.currentDevice}>Current Device</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.removeButton, isCurrentDevice && styles.disabledButton]}
          onPress={() => handleRemoveDevice(item.id)}
          disabled={isCurrentDevice || removingDeviceId === item.id}
        >
          {removingDeviceId === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // If not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Device Management' }} />
        <Text style={styles.title}>
          Device Not Registered
        </Text>
        <Text style={styles.message}>
          This device is not registered. Please register it first.
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Device Management' }} />
      <Text style={styles.title}>
        Registered Devices
      </Text>
      
      {registeredDevices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No devices registered yet</Text>
        </View>
      ) : (
        <FlatList
          data={registeredDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    marginBottom: 12,
    borderRadius: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  currentDevice: {
    marginTop: 8,
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
}); 