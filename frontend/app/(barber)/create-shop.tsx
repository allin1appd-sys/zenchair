import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

interface WorkingHour {
  day: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export default function CreateShopScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    latitude: 31.7683, // Default: Jerusalem
    longitude: 35.2137
  });
  
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([
    { day: 0, open_time: '09:00', close_time: '18:00', is_closed: false }, // Monday
    { day: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
    { day: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
    { day: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
    { day: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
    { day: 5, open_time: '09:00', close_time: '14:00', is_closed: false }, // Friday
    { day: 6, open_time: '09:00', close_time: '18:00', is_closed: true }   // Saturday closed
  ]);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setFormData(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }));
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude
    }));
  };

  const toggleDayClosed = (dayIndex: number) => {
    const updated = [...workingHours];
    updated[dayIndex].is_closed = !updated[dayIndex].is_closed;
    setWorkingHours(updated);
  };

  const updateWorkingHour = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    const updated = [...workingHours];
    updated[dayIndex][field] = value;
    setWorkingHours(updated);
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const shopData = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        location: {
          address: formData.address,
          city: formData.city,
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        working_hours: workingHours
      };

      const response = await axios.post('/barbers/shops', shopData);

      if (response.data.success) {
        Alert.alert(
          'Success!',
          'Your barbershop is now live! Customers can find you on the map.',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => router.replace('/(barber)/dashboard')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to create shop'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Basic Information
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Shop Name *
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., Elite Cuts Barbershop"
          placeholderTextColor={theme.textTertiary}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Description *
        </Text>
        <TextInput
          style={[styles.textArea, { color: theme.text, borderColor: theme.border }]}
          placeholder="Tell customers about your shop..."
          placeholderTextColor={theme.textTertiary}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Phone Number *
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="+972-50-123-4567"
          placeholderTextColor={theme.textTertiary}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Email (Optional)
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="shop@example.com"
          placeholderTextColor={theme.textTertiary}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        📍 Shop Location
      </Text>
      
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Drag the pin to your barbershop's exact location
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Address *
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="Street address"
          placeholderTextColor={theme.textTertiary}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          City *
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="Jerusalem, Tel Aviv, etc."
          placeholderTextColor={theme.textTertiary}
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: formData.latitude,
            longitude: formData.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }}
          onPress={handleMapPress}
        >
          <Marker
            coordinate={{
              latitude: formData.latitude,
              longitude: formData.longitude
            }}
            draggable
            onDragEnd={handleMapPress}
          >
            <View style={styles.customMarker}>
              <Ionicons name="cut" size={24} color={theme.primary} />
            </View>
          </Marker>
        </MapView>
        
        <View style={[styles.mapOverlay, { backgroundColor: theme.card }]}>
          <Text style={[styles.coordsText, { color: theme.textSecondary }]}>
            📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Working Hours
      </Text>

      {workingHours.map((hour, index) => (
        <View key={index} style={[styles.dayRow, { borderBottomColor: theme.border }]}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayName, { color: theme.text }]}>
              {dayNames[index]}
            </Text>
            <TouchableOpacity
              style={[
                styles.closedToggle,
                hour.is_closed && { backgroundColor: theme.error }
              ]}
              onPress={() => toggleDayClosed(index)}
            >
              <Text style={styles.closedText}>
                {hour.is_closed ? 'Closed' : 'Open'}
              </Text>
            </TouchableOpacity>
          </View>

          {!hour.is_closed && (
            <View style={styles.timeInputs}>
              <TextInput
                style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                value={hour.open_time}
                onChangeText={(text) => updateWorkingHour(index, 'open_time', text)}
                placeholder="09:00"
                placeholderTextColor={theme.textTertiary}
              />
              <Text style={[styles.timeSeparator, { color: theme.textSecondary }]}>
                to
              </Text>
              <TextInput
                style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                value={hour.close_time}
                onChangeText={(text) => updateWorkingHour(index, 'close_time', text)}
                placeholder="18:00"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Create Your Shop
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                { backgroundColor: s <= step ? theme.primary : theme.border }
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.surface }]}>
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Create Shop</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16
  },
  stepContainer: {
    gap: 16
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8
  },
  map: {
    flex: 1
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '600'
  },
  dayRow: {
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600'
  },
  closedToggle: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#4CAF50'
  },
  closedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  timeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'center'
  },
  timeSeparator: {
    fontSize: 14
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  nextButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  }
});
