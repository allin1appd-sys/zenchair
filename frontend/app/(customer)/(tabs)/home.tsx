import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [quickAccess, setQuickAccess] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async (city?: string) => {
    try {
      const params = city ? { city } : {};
      const response = await axios.get('/barbers/shops', { params });
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchShops(searchQuery.trim());
    } else {
      fetchShops();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find Barbers</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/barber-login')}>
          <View style={[styles.barberButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="cut" size={16} color="#FFF" />
            <Text style={styles.barberButtonText}>Barber</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Search by city..." placeholderTextColor={theme.textTertiary} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} />
        </View>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {shops.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No barbershops found</Text>
            </View>
          ) : (
            shops.map((shop) => (
              <TouchableOpacity key={shop._id} style={[styles.shopCard, { backgroundColor: theme.card }]} onPress={() => router.push(`/shop/${shop._id}`)}>
                <View style={styles.shopHeader}>
                  <View style={styles.shopInfo}>
                    <Text style={[styles.shopName, { color: theme.text }]}>{shop.name}</Text>
                    <Text style={[styles.shopAddress, { color: theme.textSecondary }]}>{shop.location.city}</Text>
                  </View>
                  <View style={styles.shopMeta}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: shop.is_open ? '#4CAF50' : '#F44336' }]}>
                      <Text style={styles.statusText}>{shop.is_open ? 'Open' : 'Closed'}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.shopDescription, { color: theme.textSecondary }]} numberOfLines={2}>{shop.description}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  barberButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  barberButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 24, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 16 },
  shopCard: { padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  shopAddress: { fontSize: 14 },
  shopMeta: { gap: 8, alignItems: 'flex-end' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  shopDescription: { fontSize: 14, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16 }
});
