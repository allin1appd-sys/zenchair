import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
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
    
    // Listen for real-time booking notifications
    if (socket && shop) {
      socket.emit('subscribe_to_shop', { shop_id: shop._id });
      
      socket.on('new_booking', (data) => {
        console.log('📢 New booking received:', data);
        fetchDashboardData();
      });
      
      socket.on('booking_cancelled', (data) => {
        console.log('📢 Booking cancelled:', data);
        fetchDashboardData();
      });
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
      // Get shop
      const shopResponse = await axios.get('/barbers/shops/my');
      setShop(shopResponse.data);
      
      // Get bookings
      if (shopResponse.data) {
        const bookingsResponse = await axios.get(`/bookings/shop/${shopResponse.data._id}`);
        const bookings = bookingsResponse.data;
        
        // Filter today's bookings
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayList = bookings.filter((b: any) => b.date === today);
        const upcomingList = bookings.filter((b: any) => \n          b.date >= today && b.status !== 'cancelled' && b.status !== 'completed'\n        );
        
        setTodayBookings(todayList);
        setUpcomingBookings(upcomingList.slice(0, 5));
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No shop created yet
        setShop(null);
      }
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (\n      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>\n        <View style={styles.loadingContainer}>\n          <ActivityIndicator size=\"large\" color={theme.primary} />\n        </View>\n      </SafeAreaView>\n    );\n  }\n\n  // No shop created yet - redirect to create shop\n  if (!shop) {\n    return (\n      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>\n        <View style={styles.emptyState}>\n          <Ionicons name=\"storefront-outline\" size={64} color={theme.textTertiary} />\n          <Text style={[styles.emptyTitle, { color: theme.text }]}>\n            Create Your Shop\n          </Text>\n          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>\n            Set up your barbershop profile to start receiving bookings\n          </Text>\n          <TouchableOpacity\n            style={[styles.createButton, { backgroundColor: theme.primary }]}\n            onPress={() => router.push('/(barber)/create-shop')}\n          >\n            <Text style={styles.createButtonText}>Create Shop</Text>\n          </TouchableOpacity>\n        </View>\n      </SafeAreaView>\n    );\n  }\n\n  return (\n    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>\n      <ScrollView\n        refreshControl={\n          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />\n        }\n      >\n        {/* Header */}\n        <View style={styles.header}>\n          <View>\n            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>\n              Welcome back,\n            </Text>\n            <Text style={[styles.shopName, { color: theme.text }]}>\n              {shop.name}\n            </Text>\n          </View>\n          <TouchableOpacity>\n            <Ionicons name=\"notifications-outline\" size={24} color={theme.text} />\n          </TouchableOpacity>\n        </View>\n\n        {/* Quick Stats */}\n        <View style={styles.statsContainer}>\n          <View style={[styles.statCard, { backgroundColor: theme.card }]}>\n            <Ionicons name=\"calendar\" size={24} color={theme.primary} />\n            <Text style={[styles.statNumber, { color: theme.text }]}>\n              {todayBookings.length}\n            </Text>\n            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>\n              Today's Bookings\n            </Text>\n          </View>\n\n          <View style={[styles.statCard, { backgroundColor: theme.card }]}>\n            <Ionicons name=\"star\" size={24} color=\"#FFB800\" />\n            <Text style={[styles.statNumber, { color: theme.text }]}>\n              {shop.rating.toFixed(1)}\n            </Text>\n            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>\n              Rating\n            </Text>\n          </View>\n\n          <View style={[styles.statCard, { backgroundColor: theme.card }]}>\n            <Ionicons name=\"people\" size={24} color={theme.success} />\n            <Text style={[styles.statNumber, { color: theme.text }]}>\n              {shop.total_reviews}\n            </Text>\n            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>\n              Reviews\n            </Text>\n          </View>\n        </View>\n\n        {/* Today's Bookings */}\n        <View style={styles.section}>\n          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Schedule</Text>\n          {todayBookings.length === 0 ? (\n            <View style={[styles.emptyBookings, { backgroundColor: theme.surface }]}>\n              <Text style={[styles.emptyBookingsText, { color: theme.textSecondary }]}>\n                No bookings today\n              </Text>\n            </View>\n          ) : (\n            todayBookings.map((booking) => (\n              <View key={booking._id} style={[styles.bookingCard, { backgroundColor: theme.card }]}>\n                <View style={styles.bookingTime}>\n                  <Ionicons name=\"time\" size={20} color={theme.primary} />\n                  <Text style={[styles.bookingTimeText, { color: theme.text }]}>\n                    {booking.time}\n                  </Text>\n                </View>\n                <View style={styles.bookingDetails}>\n                  <Text style={[styles.customerName, { color: theme.text }]}>\n                    {booking.customer?.name}\n                  </Text>\n                  <Text style={[styles.bookingServices, { color: theme.textSecondary }]}>\n                    {booking.services?.map((s: any) => s.name).join(', ')}\n                  </Text>\n                  <Text style={[styles.bookingPrice, { color: theme.primary }]}>\n                    \u20aa{booking.total_price}\n                  </Text>\n                </View>\n                <View style={[\n                  styles.statusDot,\n                  { backgroundColor: booking.status === 'confirmed' ? '#4CAF50' : '#FF9800' }\n                ]} />\n              </View>\n            ))\n          )}\n        </View>\n\n        {/* Quick Actions */}\n        <View style={styles.section}>\n          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>\n          <View style={styles.actionsGrid}>\n            <TouchableOpacity\n              style={[styles.actionCard, { backgroundColor: theme.card }]}\n              onPress={() => router.push('/(barber)/manage-services')}\n            >\n              <Ionicons name=\"cut\" size={28} color={theme.primary} />\n              <Text style={[styles.actionText, { color: theme.text }]}>Services</Text>\n            </TouchableOpacity>\n\n            <TouchableOpacity\n              style={[styles.actionCard, { backgroundColor: theme.card }]}\n              onPress={() => router.push('/(barber)/manage-products')}\n            >\n              <Ionicons name=\"pricetag\" size={28} color={theme.primary} />\n              <Text style={[styles.actionText, { color: theme.text }]}>Products</Text>\n            </TouchableOpacity>\n\n            <TouchableOpacity\n              style={[styles.actionCard, { backgroundColor: theme.card }]}\n              onPress={() => router.push('/(barber)/manage-gallery')}\n            >\n              <Ionicons name=\"images\" size={28} color={theme.primary} />\n              <Text style={[styles.actionText, { color: theme.text }]}>Gallery</Text>\n            </TouchableOpacity>\n\n            <TouchableOpacity\n              style={[styles.actionCard, { backgroundColor: theme.card }]}\n              onPress={() => router.push('/(barber)/settings')}\n            >\n              <Ionicons name=\"settings\" size={28} color={theme.primary} />\n              <Text style={[styles.actionText, { color: theme.text }]}>Settings</Text>\n            </TouchableOpacity>\n          </View>\n        </View>\n\n        {/* Upcoming Bookings */}\n        <View style={styles.section}>\n          <View style={styles.sectionHeader}>\n            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Bookings</Text>\n            <TouchableOpacity>\n              <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>\n            </TouchableOpacity>\n          </View>\n          {upcomingBookings.map((booking) => (\n            <View key={booking._id} style={[styles.upcomingCard, { backgroundColor: theme.card }]}>\n              <View style={styles.upcomingDate}>\n                <Text style={[styles.upcomingDateText, { color: theme.primary }]}>\n                  {booking.date}\n                </Text>\n                <Text style={[styles.upcomingTimeText, { color: theme.textSecondary }]}>\n                  {booking.time}\n                </Text>\n              </View>\n              <View style={styles.upcomingInfo}>\n                <Text style={[styles.upcomingCustomer, { color: theme.text }]}>\n                  {booking.customer?.name}\n                </Text>\n                <Text style={[styles.upcomingService, { color: theme.textSecondary }]}>\n                  {booking.services?.[0]?.name}\n                </Text>\n              </View>\n            </View>\n          ))}\n        </View>\n      </ScrollView>\n    </SafeAreaView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1\n  },\n  header: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    padding: 16\n  },\n  welcomeText: {\n    fontSize: 14,\n    marginBottom: 4\n  },\n  shopName: {\n    fontSize: 24,\n    fontWeight: 'bold'\n  },\n  statsContainer: {\n    flexDirection: 'row',\n    paddingHorizontal: 16,\n    gap: 12,\n    marginBottom: 24\n  },\n  statCard: {\n    flex: 1,\n    padding: 16,\n    borderRadius: 12,\n    alignItems: 'center',\n    gap: 8\n  },\n  statNumber: {\n    fontSize: 24,\n    fontWeight: 'bold'\n  },\n  statLabel: {\n    fontSize: 12,\n    textAlign: 'center'\n  },\n  section: {\n    paddingHorizontal: 16,\n    marginBottom: 24\n  },\n  sectionHeader: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    marginBottom: 12\n  },\n  sectionTitle: {\n    fontSize: 20,\n    fontWeight: 'bold'\n  },\n  seeAllText: {\n    fontSize: 14,\n    fontWeight: '600'\n  },\n  bookingCard: {\n    flexDirection: 'row',\n    padding: 16,\n    borderRadius: 12,\n    marginBottom: 8,\n    gap: 12,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3\n  },\n  bookingTime: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    gap: 6\n  },\n  bookingTimeText: {\n    fontSize: 16,\n    fontWeight: 'bold'\n  },\n  bookingDetails: {\n    flex: 1\n  },\n  customerName: {\n    fontSize: 16,\n    fontWeight: '600',\n    marginBottom: 4\n  },\n  bookingServices: {\n    fontSize: 14,\n    marginBottom: 4\n  },\n  bookingPrice: {\n    fontSize: 16,\n    fontWeight: 'bold'\n  },\n  statusDot: {\n    width: 12,\n    height: 12,\n    borderRadius: 6\n  },\n  emptyBookings: {\n    padding: 32,\n    borderRadius: 12,\n    alignItems: 'center'\n  },\n  emptyBookingsText: {\n    fontSize: 16\n  },\n  actionsGrid: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    gap: 12\n  },\n  actionCard: {\n    width: '48%',\n    padding: 20,\n    borderRadius: 12,\n    alignItems: 'center',\n    gap: 8,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.1,\n    shadowRadius: 4,\n    elevation: 3\n  },\n  actionText: {\n    fontSize: 14,\n    fontWeight: '600'\n  },\n  upcomingCard: {\n    flexDirection: 'row',\n    padding: 12,\n    borderRadius: 12,\n    marginBottom: 8,\n    gap: 12\n  },\n  upcomingDate: {\n    width: 80,\n    alignItems: 'center'\n  },\n  upcomingDateText: {\n    fontSize: 14,\n    fontWeight: '600',\n    marginBottom: 2\n  },\n  upcomingTimeText: {\n    fontSize: 12\n  },\n  upcomingInfo: {\n    flex: 1\n  },\n  upcomingCustomer: {\n    fontSize: 15,\n    fontWeight: '600',\n    marginBottom: 4\n  },\n  upcomingService: {\n    fontSize: 13\n  },\n  loadingContainer: {\n    flex: 1,\n    justifyContent: 'center',\n    alignItems: 'center'\n  },\n  emptyState: {\n    flex: 1,\n    justifyContent: 'center',\n    alignItems: 'center',\n    padding: 32\n  },\n  emptyTitle: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    marginTop: 16,\n    marginBottom: 8\n  },\n  emptyText: {\n    fontSize: 16,\n    textAlign: 'center',\n    marginBottom: 24\n  },\n  createButton: {\n    paddingHorizontal: 32,\n    paddingVertical: 16,\n    borderRadius: 12\n  },\n  createButtonText: {\n    color: '#FFF',\n    fontSize: 16,\n    fontWeight: '600'\n  }\n});\n