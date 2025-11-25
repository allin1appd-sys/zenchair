import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format, addDays } from 'date-fns';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShop();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchShop = async () => {
    try {
      const response = await axios.get(`/barbers/shops/${id}`);
      setShop(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date: string) => {
    try {
      const response = await axios.get(`/bookings/available-slots/${id}`, { params: { date } });
      setAvailableSlots(response.data.available_slots || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const get7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      dates.push({ full: format(date, 'yyyy-MM-dd'), display: format(date, 'EEE d') });
    }
    return dates;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      Alert.alert('Error', 'Please select service, date and time');
      return;
    }
    try {
      const response = await axios.post('/bookings', {
        shop_id: id,
        service_ids: selectedServices,
        product_ids: [],
        date: selectedDate,
        time: selectedTime
      });
      if (response.data.success) {
        Alert.alert('Success', 'Booking confirmed!', [
          { text: 'OK', onPress: () => router.push('/(customer)/(tabs)/bookings') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Booking failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Book Appointment</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Service</Text>
        {shop?.services?.map((service: any) => (
          <TouchableOpacity key={service._id} style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: selectedServices.includes(service._id) ? theme.primary : theme.border }]} onPress={() => setSelectedServices([service._id])}>
            <Text style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
            <Text style={[styles.servicePrice, { color: theme.primary }]}>₪{service.price}</Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {get7Days().map((date) => (
            <TouchableOpacity key={date.full} style={[styles.dateCard, { backgroundColor: selectedDate === date.full ? theme.primary : theme.card }]} onPress={() => setSelectedDate(date.full)}>
              <Text style={[styles.dateText, { color: selectedDate === date.full ? '#FFF' : theme.text }]}>{date.display}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedDate && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Time</Text>
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot) => (
                <TouchableOpacity key={slot} style={[styles.timeSlot, { backgroundColor: selectedTime === slot ? theme.primary : theme.card }]} onPress={() => setSelectedTime(slot)}>
                  <Text style={[styles.timeText, { color: selectedTime === slot ? '#FFF' : theme.text }]}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: theme.primary }]} onPress={handleBooking}>
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  serviceCard: { padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 2, flexDirection: 'row', justifyContent: 'space-between' },
  serviceName: { fontSize: 16, fontWeight: '600' },
  servicePrice: { fontSize: 18, fontWeight: 'bold' },
  dateCard: { padding: 16, borderRadius: 12, marginRight: 8, minWidth: 80, alignItems: 'center' },
  dateText: { fontSize: 14, fontWeight: '600' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { padding: 16, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '600' },
  footer: { padding: 16 },
  confirmButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' }
});
