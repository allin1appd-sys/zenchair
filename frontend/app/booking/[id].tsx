import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format, addDays, startOfDay } from 'date-fns';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [shop, setShop] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShopDetails();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchShopDetails = async () => {
    try {
      const response = await axios.get(`/barbers/shops/${id}`);
      setShop(response.data);
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await axios.get(`/bookings/available-slots/${id}`, {
        params: { date }
      });
      setAvailableSlots(response.data.available_slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const get7DayDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfDay(new Date()), i);
      dates.push({
        full: format(date, 'yyyy-MM-dd'),
        display: format(date, 'EEE'),
        day: format(date, 'd'),
        isToday: i === 0
      });
    }
    return dates;
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(p => p !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    
    selectedServices.forEach(serviceId => {
      const service = shop.services?.find((s: any) => s._id === serviceId);
      if (service) total += service.price;
    });
    
    selectedProducts.forEach(productId => {
      const product = shop.products?.find((p: any) => p._id === productId);
      if (product) total += product.price;
    });
    
    return total;
  };

  const handleBooking = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        shop_id: id,
        service_ids: selectedServices,
        product_ids: selectedProducts,
        date: selectedDate,
        time: selectedTime,
        notes
      };

      const response = await axios.post('/bookings', bookingData);

      if (response.data.success) {
        Alert.alert(
          'Booking Confirmed!',
          `Your booking at ${shop.name} is confirmed for ${selectedDate} at ${selectedTime}`,
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/(customer)/(tabs)/bookings')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.response?.data?.detail || 'Failed to create booking'
      );
    } finally {
      setSubmitting(false);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>\n      {/* Header */}\n      <View style={[styles.header, { borderBottomColor: theme.border }]}>\n        <TouchableOpacity onPress={() => router.back()}>\n          <Ionicons name=\"arrow-back\" size={24} color={theme.text} />\n        </TouchableOpacity>\n        <Text style={[styles.headerTitle, { color: theme.text }]}>Book Appointment</Text>\n        <View style={{ width: 24 }} />\n      </View>\n\n      <ScrollView style={styles.scrollView}>\n        {/* Shop Info */}\n        <View style={[styles.shopInfo, { backgroundColor: theme.surface }]}>\n          <Text style={[styles.shopName, { color: theme.text }]}>{shop?.name}</Text>\n          <Text style={[styles.shopLocation, { color: theme.textSecondary }]}>\n            {shop?.location.city}\n          </Text>\n        </View>\n\n        {/* Select Services */}\n        <View style={styles.section}>\n          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Services</Text>\n          {shop?.services?.map((service: any) => (\n            <TouchableOpacity\n              key={service._id}\n              style={[\n                styles.selectionCard,\n                { backgroundColor: theme.card, borderColor: theme.border },\n                selectedServices.includes(service._id) && {\n                  borderColor: theme.primary,\n                  backgroundColor: theme.accentLight\n                }\n              ]}\n              onPress={() => toggleService(service._id)}\n            >\n              <View style={styles.selectionLeft}>\n                <View style={[\n                  styles.checkbox,\n                  { borderColor: theme.border },\n                  selectedServices.includes(service._id) && {\n                    backgroundColor: theme.primary,\n                    borderColor: theme.primary\n                  }\n                ]}>\n                  {selectedServices.includes(service._id) && (\n                    <Ionicons name=\"checkmark\" size={16} color=\"#FFF\" />\n                  )}\n                </View>\n                <View>\n                  <Text style={[styles.itemName, { color: theme.text }]}>\n                    {service.name}\n                  </Text>\n                  <Text style={[styles.itemDuration, { color: theme.textSecondary }]}>\n                    {service.duration} min\n                  </Text>\n                </View>\n              </View>\n              <Text style={[styles.itemPrice, { color: theme.primary }]}>\n                \u20aa{service.price}\n              </Text>\n            </TouchableOpacity>\n          ))}\n        </View>\n\n        {/* Select Date - 7 Day Calendar */}\n        <View style={styles.section}>\n          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Date</Text>\n          <ScrollView horizontal showsHorizontalScrollIndicator={false}>\n            <View style={styles.dateContainer}>\n              {get7DayDates().map((date) => (\n                <TouchableOpacity\n                  key={date.full}\n                  style={[\n                    styles.dateCard,\n                    { backgroundColor: theme.card, borderColor: theme.border },\n                    selectedDate === date.full && {\n                      backgroundColor: theme.primary,\n                      borderColor: theme.primary\n                    }\n                  ]}\n                  onPress={() => {\n                    setSelectedDate(date.full);\n                    setSelectedTime(''); // Reset time when date changes\n                  }}\n                >\n                  <Text\n                    style={[\n                      styles.dateDay,\n                      { color: selectedDate === date.full ? '#FFF' : theme.text }\n                    ]}\n                  >\n                    {date.display}\n                  </Text>\n                  <Text\n                    style={[\n                      styles.dateNumber,\n                      { color: selectedDate === date.full ? '#FFF' : theme.text }\n                    ]}\n                  >\n                    {date.day}\n                  </Text>\n                  {date.isToday && selectedDate !== date.full && (\n                    <View style={styles.todayDot} />\n                  )}\n                </TouchableOpacity>\n              ))}\n            </View>\n          </ScrollView>\n        </View>\n\n        {/* Select Time */}\n        {selectedDate && (\n          <View style={styles.section}>\n            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Time</Text>\n            {availableSlots.length === 0 ? (\n              <Text style={[styles.noSlotsText, { color: theme.textSecondary }]}>\n                No available slots for this date\n              </Text>\n            ) : (\n              <View style={styles.slotsContainer}>\n                {availableSlots.map((slot) => (\n                  <TouchableOpacity\n                    key={slot}\n                    style={[\n                      styles.timeSlot,\n                      { backgroundColor: theme.card, borderColor: theme.border },\n                      selectedTime === slot && {\n                        backgroundColor: theme.primary,\n                        borderColor: theme.primary\n                      }\n                    ]}\n                    onPress={() => setSelectedTime(slot)}\n                  >\n                    <Text\n                      style={[\n                        styles.timeText,\n                        { color: selectedTime === slot ? '#FFF' : theme.text }\n                      ]}\n                    >\n                      {slot}\n                    </Text>\n                  </TouchableOpacity>\n                ))}\n              </View>\n            )}\n          </View>\n        )}\n\n        {/* Optional Products */}\n        {shop?.products?.length > 0 && (\n          <View style={styles.section}>\n            <Text style={[styles.sectionTitle, { color: theme.text }]}>\n              Add Products (Optional)\n            </Text>\n            {shop.products.map((product: any) => (\n              <TouchableOpacity\n                key={product._id}\n                style={[\n                  styles.selectionCard,\n                  { backgroundColor: theme.card, borderColor: theme.border },\n                  selectedProducts.includes(product._id) && {\n                    borderColor: theme.primary,\n                    backgroundColor: theme.accentLight\n                  }\n                ]}\n                onPress={() => toggleProduct(product._id)}\n              >\n                <View style={styles.selectionLeft}>\n                  <View style={[\n                    styles.checkbox,\n                    { borderColor: theme.border },\n                    selectedProducts.includes(product._id) && {\n                      backgroundColor: theme.primary,\n                      borderColor: theme.primary\n                    }\n                  ]}>\n                    {selectedProducts.includes(product._id) && (\n                      <Ionicons name=\"checkmark\" size={16} color=\"#FFF\" />\n                    )}\n                  </View>\n                  <Text style={[styles.itemName, { color: theme.text }]}>\n                    {product.name}\n                  </Text>\n                </View>\n                <Text style={[styles.itemPrice, { color: theme.primary }]}>\n                  \u20aa{product.price}\n                </Text>\n              </TouchableOpacity>\n            ))}\n          </View>\n        )}\n\n        {/* Notes */}\n        <View style={styles.section}>\n          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes (Optional)</Text>\n          <TextInput\n            style={[styles.notesInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}\n            placeholder=\"Any special requests?\"\n            placeholderTextColor={theme.textTertiary}\n            value={notes}\n            onChangeText={setNotes}\n            multiline\n            numberOfLines={3}\n          />\n        </View>\n\n        {/* Summary */}\n        {selectedServices.length > 0 && (\n          <View style={[styles.summary, { backgroundColor: theme.card }]}>\n            <Text style={[styles.summaryTitle, { color: theme.text }]}>Booking Summary</Text>\n            \n            <View style={styles.summaryRow}>\n              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Date & Time</Text>\n              <Text style={[styles.summaryValue, { color: theme.text }]}>\n                {selectedDate && selectedTime ? `${selectedDate} at ${selectedTime}` : 'Not selected'}\n              </Text>\n            </View>\n\n            <View style={styles.summaryRow}>\n              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Services</Text>\n              <Text style={[styles.summaryValue, { color: theme.text }]}>\n                {selectedServices.length}\n              </Text>\n            </View>\n\n            {selectedProducts.length > 0 && (\n              <View style={styles.summaryRow}>\n                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Products</Text>\n                <Text style={[styles.summaryValue, { color: theme.text }]}>\n                  {selectedProducts.length}\n                </Text>\n              </View>\n            )}\n\n            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />\n\n            <View style={styles.summaryRow}>\n              <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>\n              <Text style={[styles.totalValue, { color: theme.primary }]}>\n                \u20aa{calculateTotal()}\n              </Text>\n            </View>\n          </View>\n        )}\n      </ScrollView>\n\n      {/* Confirm Button */}\n      <View style={[styles.footer, { backgroundColor: theme.surface }]}>\n        <TouchableOpacity\n          style={[\n            styles.confirmButton,\n            { backgroundColor: theme.primary },\n            submitting && styles.buttonDisabled\n          ]}\n          onPress={handleBooking}\n          disabled={submitting || selectedServices.length === 0 || !selectedDate || !selectedTime}\n        >\n          {submitting ? (\n            <ActivityIndicator color=\"#FFF\" />\n          ) : (\n            <>\n              <Ionicons name=\"checkmark-circle\" size={24} color=\"#FFF\" />\n              <Text style={styles.confirmButtonText}>\n                Confirm Booking • \u20aa{calculateTotal()}\n              </Text>\n            </>\n          )}\n        </TouchableOpacity>\n      </View>\n    </SafeAreaView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1\n  },\n  header: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    padding: 16,\n    borderBottomWidth: 1\n  },\n  headerTitle: {\n    fontSize: 18,\n    fontWeight: '600'\n  },\n  scrollView: {\n    flex: 1\n  },\n  shopInfo: {\n    padding: 16,\n    marginBottom: 8\n  },\n  shopName: {\n    fontSize: 20,\n    fontWeight: 'bold',\n    marginBottom: 4\n  },\n  shopLocation: {\n    fontSize: 14\n  },\n  section: {\n    padding: 16,\n    marginBottom: 8\n  },\n  sectionTitle: {\n    fontSize: 18,\n    fontWeight: 'bold',\n    marginBottom: 12\n  },\n  selectionCard: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    padding: 16,\n    borderRadius: 12,\n    borderWidth: 2,\n    marginBottom: 8\n  },\n  selectionLeft: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    gap: 12,\n    flex: 1\n  },\n  checkbox: {\n    width: 24,\n    height: 24,\n    borderRadius: 6,\n    borderWidth: 2,\n    justifyContent: 'center',\n    alignItems: 'center'\n  },\n  itemName: {\n    fontSize: 16,\n    fontWeight: '600'\n  },\n  itemDuration: {\n    fontSize: 12,\n    marginTop: 2\n  },\n  itemPrice: {\n    fontSize: 18,\n    fontWeight: 'bold'\n  },\n  dateContainer: {\n    flexDirection: 'row',\n    gap: 8\n  },\n  dateCard: {\n    width: 70,\n    padding: 12,\n    borderRadius: 12,\n    alignItems: 'center',\n    borderWidth: 2\n  },\n  dateDay: {\n    fontSize: 14,\n    fontWeight: '600',\n    marginBottom: 4\n  },\n  dateNumber: {\n    fontSize: 20,\n    fontWeight: 'bold'\n  },\n  todayDot: {\n    width: 6,\n    height: 6,\n    borderRadius: 3,\n    backgroundColor: '#4CAF50',\n    marginTop: 4\n  },\n  slotsContainer: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    gap: 8\n  },\n  timeSlot: {\n    paddingHorizontal: 20,\n    paddingVertical: 12,\n    borderRadius: 8,\n    borderWidth: 2\n  },\n  timeText: {\n    fontSize: 14,\n    fontWeight: '600'\n  },\n  noSlotsText: {\n    fontSize: 14,\n    textAlign: 'center',\n    paddingVertical: 16\n  },\n  notesInput: {\n    borderWidth: 1,\n    borderRadius: 12,\n    padding: 12,\n    fontSize: 16,\n    minHeight: 80,\n    textAlignVertical: 'top'\n  },\n  summary: {\n    margin: 16,\n    padding: 16,\n    borderRadius: 12\n  },\n  summaryTitle: {\n    fontSize: 18,\n    fontWeight: 'bold',\n    marginBottom: 16\n  },\n  summaryRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    marginBottom: 12\n  },\n  summaryLabel: {\n    fontSize: 14\n  },\n  summaryValue: {\n    fontSize: 14,\n    fontWeight: '600'\n  },\n  summaryDivider: {\n    height: 1,\n    marginVertical: 12\n  },\n  totalLabel: {\n    fontSize: 18,\n    fontWeight: 'bold'\n  },\n  totalValue: {\n    fontSize: 24,\n    fontWeight: 'bold'\n  },\n  footer: {\n    padding: 16,\n    borderTopWidth: 1,\n    borderTopColor: '#E0E0E0'\n  },\n  confirmButton: {\n    height: 56,\n    borderRadius: 12,\n    flexDirection: 'row',\n    justifyContent: 'center',\n    alignItems: 'center',\n    gap: 8\n  },\n  confirmButtonText: {\n    color: '#FFF',\n    fontSize: 18,\n    fontWeight: '600'\n  },\n  buttonDisabled: {\n    opacity: 0.6\n  },\n  loadingContainer: {\n    flex: 1,\n    justifyContent: 'center',\n    alignItems: 'center'\n  }\n});\n