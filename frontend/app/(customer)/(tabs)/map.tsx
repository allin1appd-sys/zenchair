import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Try to import maps, but handle if not available (Expo Go limitation)
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;
let Location: any = null;
let mapsAvailable = false;

try {
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    Location = require('expo-location');
    mapsAvailable = true;
  }
} catch (error) {
  console.log('Maps not available in Expo Go - showing list view');
  mapsAvailable = false;
}

export default function MapScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({
    latitude: 31.7683,
    longitude: 35.2137
  });

  useEffect(() => {
    requestLocationAndFetchShops();
  }, []);

  const requestLocationAndFetchShops = async () => {
    if (Platform.OS !== 'web' && Location) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (error) {
        console.error('Location error:', error);
      }
    }
    await fetchShops();
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get('/barbers/shops');
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.webPlaceholder}>
          <Ionicons name="map-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.webTitle, { color: theme.text }]}>Map View</Text>
          <Text style={[styles.webSubtitle, { color: theme.textSecondary }]}>
            Download the mobile app to see barbershops on the interactive map
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Barbershops Near You</Text>
        <TouchableOpacity onPress={fetchShops}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {MapView && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }}
          showsUserLocation
          showsMyLocationButton
          showsCompass
        >
          {shops.map((shop) => (
            <Marker
              key={shop._id}
              coordinate={{
                latitude: shop.location.latitude,
                longitude: shop.location.longitude
              }}
            >
              <View style={[styles.customPin, { backgroundColor: theme.primary }]}>
                <Ionicons name="cut" size={20} color="#FFF" />
              </View>
              
              <Callout onPress={() => router.push(`/shop/${shop._id}`)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{shop.name}</Text>
                  <View style={styles.calloutRating}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.calloutRatingText}>{shop.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.calloutAddress}>{shop.location.city}</Text>
                  <View style={[styles.calloutButton, { backgroundColor: theme.primary }]}>
                    <Text style={styles.calloutButtonText}>View Shop</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {shops.length > 0 && (
        <View style={[styles.shopCounter, { backgroundColor: theme.card }]}>
          <Ionicons name="storefront" size={16} color={theme.primary} />
          <Text style={[styles.counterText, { color: theme.text }]}>
            {shops.length} barbershops found
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  map: { flex: 1 },
  customPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFF'
  },
  callout: {
    width: 200,
    padding: 12
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4
  },
  calloutRatingText: {
    fontSize: 14,
    fontWeight: '600'
  },
  calloutAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8
  },
  calloutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  calloutButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  shopCounter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 16
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8
  },
  webSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  }
});
