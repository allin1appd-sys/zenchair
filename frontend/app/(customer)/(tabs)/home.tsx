import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';

// Only import MapView on native platforms
let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
}

const Location = Platform.OS !== 'web' ? require('expo-location') : null;

const { width } = Dimensions.get('window');

interface BarberShop {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  rating: number;
  is_open: boolean;
  description: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [quickAccess, setQuickAccess] = useState<'nearby' | 'favorites' | 'recent'>('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<BarberShop[]>([]);
  const [favorites, setFavorites] = useState<BarberShop[]>([]);
  const [recent, setRecent] = useState<BarberShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({
    latitude: 31.7683,
    longitude: 35.2137
  });

  useEffect(() => {
    requestLocationPermission();
    fetchShops();
    fetchFavorites();
    fetchRecent();
  }, []);

  const requestLocationPermission = async () => {
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
      console.error('Location permission error:', error);
    }
  };

  const fetchShops = async (city?: string) => {
    try {
      const params = city ? { city } : {};
      const response = await axios.get('/barbers/shops', { params });
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchRecent = async () => {
    try {
      const response = await axios.get('/favorites/recent');
      setRecent(response.data);
    } catch (error) {
      console.error('Error fetching recent:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchShops(searchQuery.trim());
    } else {
      fetchShops();
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const getDisplayShops = () => {
    switch (quickAccess) {
      case 'favorites':
        return favorites;
      case 'recent':
        return recent;
      default:
        // Sort by distance for nearby
        return [...shops].sort((a, b) => {
          const distA = parseFloat(calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.location.latitude,
            a.location.longitude
          ));
          const distB = parseFloat(calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.location.latitude,
            b.location.longitude
          ));
          return distA - distB;
        });
    }
  };

  const renderShopCard = (shop: BarberShop) => {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      shop.location.latitude,
      shop.location.longitude
    );

    return (
      <TouchableOpacity
        key={shop._id}
        style={[styles.shopCard, { backgroundColor: theme.card }]}
        onPress={() => router.push(`/shop/${shop._id}`)}
      >
        <View style={styles.shopCardHeader}>
          <View style={styles.shopInfo}>
            <Text style={[styles.shopName, { color: theme.text }]}>  
              {shop.name}
            </Text>
            <Text style={[styles.shopAddress, { color: theme.textSecondary }]}>
              {shop.location.city} • {distance} km
            </Text>
          </View>
          <View style={styles.shopMeta}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: shop.is_open ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>
                {shop.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
        <Text
          style={[styles.shopDescription, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {shop.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Find Barbers
        </Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by city..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Quick Access Tabs */}
      <View style={[styles.quickAccessContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.quickTab,
            quickAccess === 'nearby' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setQuickAccess('nearby')}
        >
          <Ionicons
            name="location"
            size={18}
            color={quickAccess === 'nearby' ? '#FFF' : theme.text}
          />
          <Text
            style={[
              styles.quickTabText,
              { color: quickAccess === 'nearby' ? '#FFF' : theme.text }
            ]}
          >
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickTab,
            quickAccess === 'favorites' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setQuickAccess('favorites')}
        >
          <Ionicons
            name="heart"
            size={18}
            color={quickAccess === 'favorites' ? '#FFF' : theme.text}
          />
          <Text
            style={[
              styles.quickTabText,
              { color: quickAccess === 'favorites' ? '#FFF' : theme.text }
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickTab,
            quickAccess === 'recent' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setQuickAccess('recent')}
        >
          <Ionicons
            name="time"
            size={18}
            color={quickAccess === 'recent' ? '#FFF' : theme.text}
          />
          <Text
            style={[
              styles.quickTabText,
              { color: quickAccess === 'recent' ? '#FFF' : theme.text }
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map/List Toggle */}
      <View style={[styles.viewToggle, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'map' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons
            name="map"
            size={18}
            color={activeTab === 'map' ? '#FFF' : theme.text}
          />
          <Text
            style={[
              styles.toggleText,
              { color: activeTab === 'map' ? '#FFF' : theme.text }
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'list' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === 'list' ? '#FFF' : theme.text}
          />
          <Text
            style={[
              styles.toggleText,
              { color: activeTab === 'list' ? '#FFF' : theme.text }
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : activeTab === 'map' ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {getDisplayShops().map((shop) => (
            <Marker
              key={shop._id}
              coordinate={{
                latitude: shop.location.latitude,
                longitude: shop.location.longitude
              }}
              onPress={() => router.push(`/shop/${shop._id}`)}
            >
              <View style={[styles.markerContainer, { backgroundColor: theme.primary }]}>
                <Ionicons name="cut" size={20} color="#FFF" />
              </View>
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{shop.name}</Text>
                  <View style={styles.calloutRating}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.calloutRatingText}>
                      {shop.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <ScrollView style={styles.listContainer}>
          {getDisplayShops().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {quickAccess === 'favorites' ? 'No favorites yet' :
                 quickAccess === 'recent' ? 'No recent visits' :
                 'No barbershops found nearby'}
              </Text>
            </View>
          ) : (
            getDisplayShops().map(renderShopCard)
          )}
        </ScrollView>
      )}
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
    padding: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16
  },
  quickAccessContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8
  },
  quickTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  quickTabText: {
    fontSize: 13,
    fontWeight: '600'
  },
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  map: {
    flex: 1
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  calloutContainer: {
    padding: 8,
    minWidth: 150
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  calloutRatingText: {
    fontSize: 12,
    fontWeight: '600'
  },
  listContainer: {
    flex: 1,
    padding: 16
  },
  shopCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  shopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  shopInfo: {
    flex: 1
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  shopAddress: {
    fontSize: 14
  },
  shopMeta: {
    gap: 8,
    alignItems: 'flex-end'
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600'
  },
  shopDescription: {
    fontSize: 14,
    lineHeight: 20
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16
  }
});
