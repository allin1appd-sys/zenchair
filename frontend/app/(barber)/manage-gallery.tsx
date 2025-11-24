import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function ManageGalleryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [shop, setShop] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      const response = await axios.get('/barbers/shops/my');
      setShop(response.data);
      setImages(response.data.gallery_images || []);
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
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
        await uploadImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      setUploading(true);
      await axios.post(`/barbers/shops/${shop._id}/gallery`, {
        image: base64Image
      });
      fetchShop();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (index: number) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/barbers/shops/${shop._id}/gallery/${index}`);
              fetchShop();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete image');
            }
          }
        }
      ]
    );
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gallery</Text>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          <Ionicons
            name="add-circle"
            size={24}
            color={uploading ? theme.textTertiary : theme.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {uploading && (
          <View style={[styles.uploadingCard, { backgroundColor: theme.surface }]}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
              Uploading image...
            </Text>
          </View>
        )}

        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No images in your gallery
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Add photos of your work, shop interior, or promotional images
            </Text>
          </View>
        ) : (
          <View style={styles.gallery}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.galleryImage} />
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: theme.error }]}
                  onPress={() => deleteImage(index)}
                >
                  <Ionicons name="trash" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  uploadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12
  },
  uploadingText: {
    fontSize: 14
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600'
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    position: 'relative'
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
