import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function ManageServicesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const shopResponse = await axios.get('/barbers/shops/my');
      setShop(shopResponse.data);
      
      const servicesResponse = await axios.get(`/services/shop/${shopResponse.data._id}`);
      setServices(servicesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', duration: '' });
    setModalVisible(true);
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString()
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price || !formData.duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration)
      };

      if (editingService) {
        await axios.put(`/services/${editingService._id}`, serviceData);
      } else {
        await axios.post(`/services?shop_id=${shop._id}`, serviceData);
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/services/${serviceId}`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service');
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Services</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <ScrollView style={styles.scrollView}>
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No services yet. Add your first service!
            </Text>
          </View>
        ) : (
          services.map((service) => (
            <View key={service._id} style={[styles.serviceCard, { backgroundColor: theme.card }]}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: theme.text }]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceDescription, { color: theme.textSecondary }]}>
                    {service.description}
                  </Text>
                  <Text style={[styles.serviceMeta, { color: theme.textTertiary }]}>
                    {service.duration} min • ₪{service.price}
                  </Text>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(service)}
                  >
                    <Ionicons name="pencil" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(service._id)}
                  >
                    <Ionicons name="trash" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalField}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name *</Text>
                <TextInput
                  style={[styles.fieldInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Haircut, Beard Trim, etc."
                  placeholderTextColor={theme.textTertiary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.fieldTextArea, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Describe the service..."
                  placeholderTextColor={theme.textTertiary}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.modalField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Price (₪) *</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="50"
                    placeholderTextColor={theme.textTertiary}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.modalField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Duration (min) *</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="30"
                    placeholderTextColor={theme.textTertiary}
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingService ? 'Update Service' : 'Add Service'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 6
  },
  serviceMeta: {
    fontSize: 12
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  modalScroll: {
    padding: 20
  },
  modalField: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  fieldInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16
  },
  fieldTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
