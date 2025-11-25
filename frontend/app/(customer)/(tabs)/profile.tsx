import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { language } = useI18n();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCustomerInfo();
  }, []);

  const loadCustomerInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('customer_name');
      const phone = await AsyncStorage.getItem('customer_phone');
      if (name) setCustomerName(name);
      if (phone) setCustomerPhone(phone);
    } catch (error) {
      console.error('Error loading customer info:', error);
    }
  };

  const saveCustomerInfo = async () => {
    try {
      await AsyncStorage.setItem('customer_name', customerName);
      await AsyncStorage.setItem('customer_phone', customerPhone);
      setIsEditing(false);
      Alert.alert('Success', 'Your information has been saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save information');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Ionicons name="person" size={32} color="#FFF" />
          </View>
          <View style={styles.userInfo}>
            {isEditing ? (
              <>
                <TextInput style={[styles.editInput, { color: theme.text, borderColor: theme.border }]} placeholder="Your Name" placeholderTextColor={theme.textTertiary} value={customerName} onChangeText={setCustomerName} />
                <TextInput style={[styles.editInput, { color: theme.text, borderColor: theme.border }]} placeholder="Phone Number" placeholderTextColor={theme.textTertiary} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
                <View style={styles.editActions}>
                  <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={saveCustomerInfo}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.surface }]} onPress={() => setIsEditing(false)}>
                    <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.userName, { color: theme.text }]}>{customerName || 'Guest User'}</Text>
                <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{customerPhone || 'No phone number'}</Text>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary }]} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={16} color="#FFF" />
                  <Text style={styles.editButtonText}>Edit Info</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#D0D0D0', true: theme.primary }} />
          </View>
        </View>
        <View style={[styles.infoBox, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Save your name and phone to pre-fill booking forms automatically</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  userCard: { margin: 16, padding: 20, borderRadius: 12, gap: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  userInfo: { alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  userPhone: { fontSize: 16, marginBottom: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  editButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  editInput: { width: '100%', height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 16 },
  infoBox: { margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 }
});
