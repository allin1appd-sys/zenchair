import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const AUTH_URL = 'https://auth.emergentagent.com';
const REDIRECT_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'username' | 'google'>('username');

  const handleUsernameLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim());
      // Navigation handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.detail || 'Username not found. Please register first.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setLoginMethod('google');
      
      const redirectUrl = `${REDIRECT_URL}/#/auth-callback`;
      const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        // Extract session_id from URL fragment
        const url = new URL(result.url);
        const fragment = url.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const sessionId = params.get('session_id');
        
        if (sessionId) {
          await loginWithGoogle(sessionId);
        } else {
          Alert.alert('Error', 'Failed to get session from Google');
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.primary }]}>✂️ ZenChair</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Your Premium Barber Marketplace
            </Text>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('auth', 'login')}
            </Text>

            {/* Username Login */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('auth', 'username')}
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.primary },
                loading && styles.buttonDisabled
              ]}
              onPress={handleUsernameLogin}
              disabled={loading}
            >
              {loading && loginMethod === 'username' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {t('auth', 'loginWithUsername')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.googleButton,
                { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loading && loginMethod === 'google' ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={[styles.googleButtonText, { color: theme.text }]}>
                    {t('auth', 'loginWithGoogle')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
          >
            <Text style={[styles.registerText, { color: theme.textSecondary }]}>
              {t('auth', 'dontHaveAccount')}{' '}
            </Text>
            <Text style={[styles.registerTextBold, { color: theme.primary }]}>
              {t('auth', 'register')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center'
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  primaryButton: {
    marginBottom: 16
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    gap: 12
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24
  },
  dividerLine: {
    flex: 1,
    height: 1
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600'
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24
  },
  registerText: {
    fontSize: 14
  },
  registerTextBold: {
    fontSize: 14,
    fontWeight: '600'
  }
});
