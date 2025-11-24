import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';

interface Booking {
  _id: string;
  date: string;
  time: string;
  status: string;
  total_price: number;
  shop: any;
  services: any[];
}

export default function BookingsScreen() {
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/bookings/my');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      if (filter === 'upcoming') {
        return bookingDate >= now && booking.status !== 'cancelled';
      } else {
        return bookingDate < now || booking.status === 'cancelled';
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#999';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'upcoming' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'upcoming' ? '#FFF' : theme.text }
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'past' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'past' ? '#FFF' : theme.text }
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.scrollView}>
        {getFilteredBookings().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {filter} bookings
            </Text>
          </View>
        ) : (
          getFilteredBookings().map((booking) => (
            <View key={booking._id} style={[styles.bookingCard, { backgroundColor: theme.card }]}>
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={[styles.shopName, { color: theme.text }]}>
                    {booking.shop?.name || 'Shop'}
                  </Text>
                  <Text style={[styles.bookingDate, { color: theme.textSecondary }]}>
                    {booking.date} at {booking.time}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.servicesContainer}>
                {booking.services?.map((service, idx) => (
                  <Text key={idx} style={[styles.serviceText, { color: theme.textSecondary }]}>
                    • {service.name} (₪{service.price})
                  </Text>
                ))}
              </View>

              <View style={styles.bookingFooter}>
                <Text style={[styles.totalPrice, { color: theme.primary }]}>
                  Total: ₪{booking.total_price}
                </Text>
                {booking.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.error }]}
                  >
                    <Text style={[styles.cancelText, { color: theme.error }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  bookingDate: {
    fontSize: 14
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  servicesContainer: {
    marginBottom: 12
  },
  serviceText: {
    fontSize: 14,
    marginBottom: 4
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16
  }
});
