import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

export default function BarberDashboardScreen() {
  const { theme } = useTheme();
  const { user, socket } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (socket && shop) {
      socket.emit('subscribe_to_shop', { shop_id: shop._id });
      socket.on('new_booking', (data) => { fetchDashboardData(); });
      socket.on('booking_cancelled', (data) => { fetchDashboardData(); });
    }
    return () => {
      if (socket) {
        socket.off('new_booking');
        socket.off('booking_cancelled');
      }
    };
  }, [socket, shop]);

  const fetchDashboardData = async () => {
    try {
      const shopResponse = await axios.get('/barbers/shops/my');
      setShop(shopResponse.data);
      if (shopResponse.data) {
        const bookingsResponse = await axios.get(`/bookings/shop/${shopResponse.data._id}`);
        const bookings = bookingsResponse.data;
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayList = bookings.filter((b: any) => b.date === today);
        const upcomingList = bookings.filter((b: any) => b.date >= today && b.status !== 'cancelled');
        setTodayBookings(todayList);
        setUpcomingBookings(upcomingList.slice(0, 5));
      }
    } catch (error: any) {
      if (error.response?.status === 404) { setShop(null); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Create Your Shop</Text>
          <TouchableOpacity style={[styles.createButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/(barber)/create-shop')}>
            <Text style={styles.createButtonText}>Create Shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboardData()} tintColor={theme.primary} />}>
        <View style={styles.header}>
          <Text style={[styles.shopName, { color: theme.text }]}>{shop.name}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{todayBookings.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{shop.rating.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Bookings</Text>
          {todayBookings.map((booking) => (
            <View key={booking._id} style={[styles.bookingCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.bookingTime, { color: theme.primary }]}>{booking.time}</Text>
              <Text style={[styles.customerName, { color: theme.text }]}>{booking.customer?.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]} onPress={() => router.push('/(barber)/manage-services')}>
            <Ionicons name="cut" size={28} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]} onPress={() => router.push('/(barber)/manage-gallery')}>
            <Ionicons name="images" size={28} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  shopName: { fontSize: 24, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  bookingCard: { padding: 16, borderRadius: 12, marginBottom: 8 },
  bookingTime: { fontSize: 16, fontWeight: 'bold' },
  customerName: { fontSize: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  actionCard: { width: '48%', padding: 20, borderRadius: 12, alignItems: 'center', gap: 8 },
  actionText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  createButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
