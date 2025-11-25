import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BarberLoginScreen() {
  const { theme } = useTheme();
  const { loginBarber } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/barber/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        await loginBarber(data.session_token, data.user);
      } else {
        Alert.alert('Error', data.detail || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Barber Login</Text>
        </View>
        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Username" placeholderTextColor={theme.textTertiary} value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Password" placeholderTextColor={theme.textTertiary} value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/barber-register')}>
          <Text style={[styles.registerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <Text style={[styles.registerTextBold, { color: theme.primary }]}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  formContainer: { borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  input: { height: 56, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { fontSize: 14 },
  registerTextBold: { fontSize: 14, fontWeight: '600' }
});
