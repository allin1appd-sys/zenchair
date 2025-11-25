import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    fetchShopDetails();
  }, [id]);

  const fetchShopDetails = async () => {
    try {
      const response = await axios.get(`/barbers/shops/${id}`);
      setShop(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !shop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {shop?.name || 'Shop Details'}
        </Text>
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#F44336' : theme.text}
          />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.shopInfo}>
          <Text style={[styles.shopTitle, { color: theme.text }]}>{shop.name}</Text>
          <Text style={[styles.shopDescription, { color: theme.textSecondary }]}>{shop.description}</Text>
        </View>
        <View style={styles.tabsContainer}>
          {['services', 'products', 'reviews'].map((tab) => (
            <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabContent}>
          {activeTab === 'services' && shop.services?.map((s: any) => (
            <View key={s._id} style={[styles.serviceCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.serviceName, { color: theme.text }]}>{s.name}</Text>
              <Text style={[styles.servicePrice, { color: theme.primary }]}>₪{s.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={[styles.bookButton, { backgroundColor: theme.primary }]} onPress={() => router.push(`/booking/${id}`)}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  shopInfo: { padding: 16 },
  shopTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  shopDescription: { fontSize: 15 },
  tabsContainer: { flexDirection: 'row', padding: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabContent: { padding: 16 },
  serviceCard: { padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  serviceName: { fontSize: 16, fontWeight: '600' },
  servicePrice: { fontSize: 18, fontWeight: 'bold' },
  footer: { padding: 16 },
  bookButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bookButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
