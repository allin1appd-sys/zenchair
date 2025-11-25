import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={64} color={theme.textTertiary} />
        <Text style={[styles.title, { color: theme.text }]}>Interactive Map</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Coming soon: See all barbershops on the map with interactive pins!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 }
});
