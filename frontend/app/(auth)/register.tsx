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

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'customer' as 'customer' | 'barber'
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.username.trim() || !formData.name.trim()) {
      Alert.alert('Error', 'Username and name are required');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      
      // If barber, redirect to subscription payment
      if (formData.role === 'barber') {
        router.replace('/(barber)/subscription');
      }
      // Navigation for customer handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.detail || 'Failed to create account'
      );
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
            {/* Role Selection */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>I am a:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { borderColor: theme.border },
                  formData.role === 'customer' && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary
                  }
                ]}
                onPress={() => setFormData({ ...formData, role: 'customer' })}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={formData.role === 'customer' ? '#FFF' : theme.text}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: formData.role === 'customer' ? '#FFF' : theme.text }
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { borderColor: theme.border },
                  formData.role === 'barber' && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary
                  }
                ]}
                onPress={() => setFormData({ ...formData, role: 'barber' })}
              >
                <Ionicons
                  name="cut"
                  size={24}
                  color={formData.role === 'barber' ? '#FFF' : theme.text}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: formData.role === 'barber' ? '#FFF' : theme.text }
                  ]}
                >
                  Barber
                </Text>
              </TouchableOpacity>
            </View>

            {formData.role === 'barber' && (
              <View style={[styles.infoBox, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="information-circle" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.primary }]}>
                  Barbers need to subscribe (500₪/month) before creating their shop
                </Text>
              </View>
            )}

            {/* Username */}
            <View style={styles.inputContainer}>
              <Ionicons name="at" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Username *"
                placeholderTextColor={theme.textTertiary}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name *"
                placeholderTextColor={theme.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email (optional)"
                placeholderTextColor={theme.textTertiary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Phone (optional)"
                placeholderTextColor={theme.textTertiary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                loading && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={[styles.loginText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Text style={[styles.loginTextBold, { color: theme.primary }]}>
              Login
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
    padding: 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8
  },
  backButton: {
    marginRight: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold'
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500'
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
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24
  },
  loginText: {
    fontSize: 14
  },
  loginTextBold: {
    fontSize: 14,
    fontWeight: '600'
  }
});
