import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function CreateShopScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    latitude: 31.7683,
    longitude: 35.2137
  });

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets[0].base64) {
        setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickGalleryImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets[0].base64) {
        setGalleryImages([...galleryImages, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeGalleryImage = (index: number) => {
    const updated = [...galleryImages];
    updated.splice(index, 1);
    setGalleryImages(updated);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.phone || !formData.address || !formData.city) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
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
        working_hours: [
          { day: 0, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day: 5, open_time: '09:00', close_time: '14:00', is_closed: false },
          { day: 6, open_time: '09:00', close_time: '18:00', is_closed: true }
        ]
      };
      const response = await axios.post('/barbers/shops', shopData);
      if (response.data.success) {
        const shopId = response.data.shop_id;
        if (galleryImages.length > 0) {
          for (const img of galleryImages) {
            await axios.post(`/barbers/shops/${shopId}/gallery`, { image: img });
          }
        }
        Alert.alert('Success!', 'Your barbershop is now live!', [
          { text: 'Go to Dashboard', onPress: () => router.replace('/(barber)/dashboard') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Shop Identity</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>Create your barbershop brand</Text>
      
      <View style={styles.logoSection}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Shop Logo</Text>
        <TouchableOpacity style={[styles.logoUpload, { borderColor: theme.border }]} onPress={pickLogo}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logoImage} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.surface }]}>
              <Ionicons name="add" size={32} color={theme.primary} />
              <Text style={[styles.logoText, { color: theme.textSecondary }]}>Add Logo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Shop Name *</Text>
        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="Elite Cuts Barbershop" placeholderTextColor={theme.textTertiary} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Description *</Text>
        <TextInput style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="Tell customers about your shop..." placeholderTextColor={theme.textTertiary} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline numberOfLines={4} />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Shop Gallery</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary}]}>Showcase your best work</Text>
      
      <View style={styles.gallerySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
          <TouchableOpacity style={[styles.addImageButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={pickGalleryImage}>
            <Ionicons name="camera" size={28} color={theme.primary} />
            <Text style={[styles.addImageText, { color: theme.textSecondary }]}>Add Photo</Text>
          </TouchableOpacity>
          {galleryImages.map((img, idx) => (
            <View key={idx} style={styles.galleryImageContainer}>
              <Image source={{ uri: img }} style={styles.galleryImage} />
              <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.error }]} onPress={() => removeGalleryImage(idx)}>
                <Ionicons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={[styles.galleryHint, { color: theme.textTertiary }]}>Add photos of your work, shop interior, or team</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number *</Text>
        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="+972-50-123-4567" placeholderTextColor={theme.textTertiary} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Email (Optional)</Text>
        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="shop@example.com" placeholderTextColor={theme.textTertiary} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Location</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>Where customers can find you</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Address *</Text>
        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="Street address" placeholderTextColor={theme.textTertiary} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>City *</Text>
        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} placeholder="Jerusalem, Tel Aviv, Haifa..." placeholderTextColor={theme.textTertiary} value={formData.city} onChangeText={(text) => setFormData({ ...formData, city: text })} />
      </View>

      <View style={[styles.locationHint, { backgroundColor: theme.accentLight }]}>
        <Ionicons name="location" size={20} color={theme.primary} />
        <Text style={[styles.locationHintText, { color: theme.textSecondary }]}>
          Your shop will appear on the map for customers to find!
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Your Shop</Text>
        <Text style={[styles.stepIndicator, { color: theme.primary }]}>Step {step}/3</Text>
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressSegment, s <= step && { backgroundColor: theme.primary }, s > step && { backgroundColor: theme.border }]} />
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        {step < 3 ? (
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.primary }]} onPress={() => setStep(step + 1)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.nextButtonText}>Create Shop</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  stepIndicator: { fontSize: 14, fontWeight: '600' },
  progressBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  stepContainer: { gap: 24 },
  stepTitle: { fontSize: 28, fontWeight: 'bold' },
  stepSubtitle: { fontSize: 16, marginTop: -16 },
  logoSection: { alignItems: 'center', marginVertical: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  logoUpload: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: '100%', height: '100%', borderRadius: 70 },
  logoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 14, fontWeight: '600' },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { height: 56, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  gallerySection: { gap: 12 },
  galleryScroll: { marginBottom: 8 },
  addImageButton: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 12, gap: 8 },
  addImageText: { fontSize: 12, fontWeight: '600' },
  galleryImageContainer: { width: 120, height: 120, borderRadius: 12, marginRight: 12, position: 'relative' },
  galleryImage: { width: '100%', height: '100%', borderRadius: 12 },
  removeImageButton: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  galleryHint: { fontSize: 12, textAlign: 'center' },
  locationHint: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, alignItems: 'center' },
  locationHintText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { padding: 16, borderTopWidth: 1 },
  nextButton: { height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' }
});
