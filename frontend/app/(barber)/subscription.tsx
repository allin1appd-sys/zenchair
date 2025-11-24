import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const plans = {
    monthly: {
      price: 500,
      period: 'month',
      savings: null,
      features: [
        'Create your barbershop profile',
        'Unlimited services & products',
        'Online booking system',
        'Customer reviews & ratings',
        'Real-time notifications',
        'Photo gallery',
        'Business analytics'
      ]
    },
    yearly: {
      price: 5000,
      period: 'year',
      savings: 1000,
      effectiveMonthly: 417,
      features: [
        'All monthly features',
        'Save ₪1,000 per year',
        '2 months FREE',
        'Priority support',
        'Advanced analytics',
        'Marketing tools'
      ]
    }
  };

  const handlePayment = async () => {
    // TODO: Integrate with Tranzila when credentials are provided
    Alert.alert(
      'Payment Gateway',
      'Tranzila payment integration will be added once you provide:\n\n• Terminal Name\n• API Key\n• Test credentials\n\nFor now, simulating successful payment...',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Simulate Payment',
          onPress: () => {
            // Simulate successful payment
            Alert.alert(
              'Success!',
              'Payment successful! Now create your barbershop.',
              [
                {
                  text: 'Create Shop',
                  onPress: () => router.replace('/(barber)/create-shop')
                }
              ]
            );
          }
        }
      ]
    );
  };

  const plan = plans[selectedPlan];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start your barbershop journey
          </Text>
        </View>

        {/* Plan Toggle */}
        <View style={[styles.planToggle, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === 'monthly' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text
              style={[
                styles.planButtonText,
                { color: selectedPlan === 'monthly' ? '#FFF' : theme.text }
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === 'yearly' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View>
              <Text
                style={[
                  styles.planButtonText,
                  { color: selectedPlan === 'yearly' ? '#FFF' : theme.text }
                ]}
              >
                Yearly
              </Text>
              {selectedPlan === 'yearly' && (
                <Text style={styles.savingsBadge}>Save ₪1,000</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Card */}
        <View style={[styles.planCard, { backgroundColor: theme.card }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.currency, { color: theme.primary }]}>₪</Text>
            <Text style={[styles.price, { color: theme.text }]}>
              {plan.price}
            </Text>
            <Text style={[styles.period, { color: theme.textSecondary }]}>
              /{plan.period}
            </Text>
          </View>

          {selectedPlan === 'yearly' && (
            <View style={[styles.savingsBanner, { backgroundColor: theme.success }]}>
              <Ionicons name="trophy" size={20} color="#FFF" />
              <Text style={styles.savingsText}>
                Only ₪{plan.effectiveMonthly}/month • Save ₪{plan.savings}
              </Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: theme.text }]}>
              What's Included:
            </Text>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.featureText, { color: theme.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: theme.primary }]}
            onPress={handlePayment}
            disabled={loading}
          >
            <Ionicons name="card" size={20} color="#FFF" />
            <Text style={styles.subscribeButtonText}>
              Subscribe Now • ₪{plan.price}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
            Cancel anytime. No hidden fees.
          </Text>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.primary }]}>
              After Payment
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              You'll create your barbershop profile with your PHYSICAL shop location, 
              services, and gallery. Customers will find you on the map!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 24
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16
  },
  planToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24
  },
  planButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  savingsBadge: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center'
  },
  planCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 16
  },
  currency: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8
  },
  price: {
    fontSize: 56,
    fontWeight: 'bold',
    marginHorizontal: 4
  },
  period: {
    fontSize: 20,
    marginTop: 28
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8
  },
  savingsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  },
  featuresContainer: {
    marginBottom: 24
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  featureText: {
    flex: 1,
    fontSize: 15
  },
  subscribeButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center'
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18
  }
});
