import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AuthScreen from '~/screens/AuthScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 