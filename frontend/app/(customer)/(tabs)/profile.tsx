import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // For customers, just clear user data, stay on home
    // For barbers, redirect to login
    if (user?.role === 'barber') {
      router.replace('/(auth)/barber-login');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.name}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              @{user?.username || user?.email}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PREFERENCES
          </Text>

          {/* Dark Mode */}
          <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D0D0D0', true: theme.primary }}
            />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.card }]}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Language
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {language === 'en' ? 'English' : language === 'ar' ? 'العربية' : 'עברית'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT
          </Text>

          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.card }]}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.card }]}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.logoutRow, { backgroundColor: theme.card }]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out" size={20} color={theme.error} />
              <Text style={[styles.settingText, { color: theme.error }]}>
                Logout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 16
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  settingText: {
    fontSize: 16
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  settingValue: {
    fontSize: 14
  },
  logoutRow: {
    marginTop: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
