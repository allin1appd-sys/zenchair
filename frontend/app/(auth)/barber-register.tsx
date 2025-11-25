import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const AUTH_URL = 'https://auth.emergentagent.com';
const REDIRECT_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BarberRegisterScreen() {
  const { theme } = useTheme();
  const { loginBarber, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', username: '', password: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.email || !formData.username || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/barber/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        await loginBarber(data.session_token, data.user);
        router.replace('/(barber)/subscription');
      } else {
        Alert.alert('Error', data.detail || 'Registration failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectUrl = `${REDIRECT_URL}/#/auth-callback`;
      const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const sessionId = params.get('session_id');
        if (sessionId) {
          await loginWithGoogle(sessionId);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Google authentication failed');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Barber Registration</Text>
          </View>
          <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Email *" placeholderTextColor={theme.textTertiary} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Username *" placeholderTextColor={theme.textTertiary} value={formData.username} onChangeText={(text) => setFormData({ ...formData, username: text })} autoCapitalize="none" />
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Password *" placeholderTextColor={theme.textTertiary} value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} secureTextEntry />
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Full Name *" placeholderTextColor={theme.textTertiary} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Phone (optional)" placeholderTextColor={theme.textTertiary} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create Barber Account</Text>}
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            <TouchableOpacity style={[styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleGoogleAuth}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/barber-login')}>
            <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
            <Text style={[styles.loginTextBold, { color: theme.primary }]}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  formContainer: { borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  input: { height: 56, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 14, fontWeight: '600' },
  googleButton: { height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, gap: 12 },
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14 },
  loginTextBold: { fontSize: 14, fontWeight: '600' }
});
