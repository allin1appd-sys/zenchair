import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function CreateShopScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    latitude: 31.7683,
    longitude: 35.2137
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.phone || !formData.address || !formData.city) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      const shopData = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        location: { address: formData.address, city: formData.city, latitude: formData.latitude, longitude: formData.longitude },
        working_hours: [
          { day: 0, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
          { day: 6, open_time: '09:00', close_time: '18:00', is_closed: true }
        ]
      };
      const response = await axios.post('/barbers/shops', shopData);
      if (response.data.success) {
        Alert.alert('Success!', 'Your barbershop is now live!', [{ text: 'Go to Dashboard', onPress: () => router.replace('/(barber)/dashboard') }]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Your Shop</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Shop Name *</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Elite Cuts Barbershop" placeholderTextColor={theme.textTertiary} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Description *</Text>
            <TextInput style={[styles.textArea, { color: theme.text, borderColor: theme.border }]} placeholder="Tell customers about your shop..." placeholderTextColor={theme.textTertiary} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline numberOfLines={4} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Phone *</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="+972-50-123-4567" placeholderTextColor={theme.textTertiary} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="shop@example.com" placeholderTextColor={theme.textTertiary} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Address *</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Street address" placeholderTextColor={theme.textTertiary} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>City *</Text>
            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Jerusalem, Tel Aviv, etc." placeholderTextColor={theme.textTertiary} value={formData.city} onChangeText={(text) => setFormData({ ...formData, city: text })} />
          </View>
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Create Shop</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  form: { padding: 16, gap: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  footer: { padding: 16 },
  submitButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' }
});
