import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // If user is logged in and is a barber, go to dashboard
    if (user && user.role === 'barber') {
      router.replace('/(barber)/dashboard');
    } 
    // If no user (customer or not logged in), go to customer home
    else if (!inAuthGroup) {
      router.replace('/(customer)/(tabs)/home');
    }
  }, [user, loading, segments]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.text }]}>Loading ZenChair...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600'
  }
});
