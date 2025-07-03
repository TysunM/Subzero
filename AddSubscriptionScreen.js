import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, HelperText, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

const categories = ['Entertainment', 'Productivity', 'Cloud Storage', 'News', 'Fitness', 'Shopping', 'Other'];
const billingCycles = ['monthly', 'yearly', 'weekly', 'quarterly'];

export default function AddSubscriptionScreen({ navigation }) {
  const { user } = useAuth();
  const { addSubscription, subscriptions } = useSubscriptions();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Entertainment',
    monthlyAmount: '',
    yearlyAmount: '',
    billingCycle: 'monthly',
    nextBillingDate: '',
    description: '',
    website: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isFreeTier = user?.subscriptionTier === 'free';
  const subscriptionLimit = isFreeTier ? 3 : Infinity;
  const canAddMore = subscriptions.length < subscriptionLimit;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subscription name is required';
    }

    if (!formData.monthlyAmount || isNaN(parseFloat(formData.monthlyAmount))) {
      newErrors.monthlyAmount = 'Valid monthly amount is required';
    } else if (parseFloat(formData.monthlyAmount) <= 0) {
      newErrors.monthlyAmount = 'Amount must be greater than 0';
    }

    if (!formData.nextBillingDate) {
      newErrors.nextBillingDate = 'Next billing date is required';
    } else {
      const billingDate = new Date(formData.nextBillingDate);
      const today = new Date();
      if (billingDate < today) {
        newErrors.nextBillingDate = 'Billing date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateYearlyAmount = (monthly, cycle) => {
    const monthlyValue = parseFloat(monthly) || 0;
    switch (cycle) {
      case 'weekly': return monthlyValue * 52;
      case 'monthly': return monthlyValue * 12;
      case 'quarterly': return monthlyValue * 4;
      case 'yearly': return monthlyValue;
      default: return monthlyValue * 12;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Auto-calculate yearly amount
    if (field === 'monthlyAmount' || field === 'billingCycle') {
      const monthly = field === 'monthlyAmount' ? value : formData.monthlyAmount;
      const cycle = field === 'billingCycle' ? value : formData.billingCycle;
      const yearly = calculateYearlyAmount(monthly, cycle);
      setFormData(prev => ({
        ...prev,
        yearlyAmount: yearly.toFixed(2),
      }));
    }
  };

  const handleSubmit = async () => {
    if (!canAddMore) {
      Alert.alert(
        'Subscription Limit Reached',
        'You\'ve reached the free plan limit of 3 subscriptions. Upgrade to Pro to add unlimited subscriptions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') },
        ]
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const subscriptionData = {
        ...formData,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        yearlyAmount: parseFloat(formData.yearlyAmount),
        status: 'active',
        color: getRandomColor(),
      };

      await addSubscription(subscriptionData);
      
      Alert.alert(
        'Success',
        'Subscription added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomColor = () => {
    const colors = ['#E50914', '#1DB954', '#FF0000', '#0078D4', '#FF6B35', '#4A90E2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          labelStyle={styles.backButtonText}
          icon="arrow-left"
        >
          Back
        </Button>
        <Text style={styles.headerTitle}>Add Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Free Tier Warning */}
        {isFreeTier && (
          <Card style={styles.warningCard}>
            <Card.Content style={styles.warningContent}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Free Plan Limit</Text>
                <Text style={styles.warningDescription}>
                  You can add {subscriptionLimit - subscriptions.length} more subscription{subscriptionLimit - subscriptions.length !== 1 ? 's' : ''} on the free plan.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <TextInput
              label="Subscription Name *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={styles.input}
              error={!!errors.name}
              placeholder="e.g., Netflix, Spotify, Adobe"
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={styles.input}
              placeholder="e.g., Premium plan, Family subscription"
              multiline
              numberOfLines={2}
            />

            <TextInput
              label="Website (Optional)"
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              style={styles.input}
              placeholder="e.g., netflix.com"
              keyboardType="url"
            />
          </Card.Content>
        </Card>

        {/* Category */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  mode={formData.category === category ? 'flat' : 'outlined'}
                  selected={formData.category === category}
                  onPress={() => handleInputChange('category', category)}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.selectedCategoryChip,
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    formData.category === category && styles.selectedCategoryChipText,
                  ]}
                >
                  {category}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Billing Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Billing Information</Text>
            
            <View style={styles.billingRow}>
              <View style={styles.billingInput}>
                <TextInput
                  label="Monthly Amount *"
                  value={formData.monthlyAmount}
                  onChangeText={(value) => handleInputChange('monthlyAmount', value)}
                  style={styles.input}
                  error={!!errors.monthlyAmount}
                  keyboardType="decimal-pad"
                  left={<TextInput.Affix text="$" />}
                />
                <HelperText type="error" visible={!!errors.monthlyAmount}>
                  {errors.monthlyAmount}
                </HelperText>
              </View>
              
              <View style={styles.billingInput}>
                <TextInput
                  label="Billing Cycle"
                  value={formData.billingCycle}
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </View>

            {/* Billing Cycle Options */}
            <View style={styles.cycleContainer}>
              {billingCycles.map((cycle) => (
                <Chip
                  key={cycle}
                  mode={formData.billingCycle === cycle ? 'flat' : 'outlined'}
                  selected={formData.billingCycle === cycle}
                  onPress={() => handleInputChange('billingCycle', cycle)}
                  style={[
                    styles.cycleChip,
                    formData.billingCycle === cycle && styles.selectedCycleChip,
                  ]}
                  textStyle={[
                    styles.cycleChipText,
                    formData.billingCycle === cycle && styles.selectedCycleChipText,
                  ]}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Next Billing Date *"
              value={formData.nextBillingDate}
              onChangeText={(value) => handleInputChange('nextBillingDate', value)}
              style={styles.input}
              error={!!errors.nextBillingDate}
              placeholder="YYYY-MM-DD"
              right={<TextInput.Icon icon="calendar" />}
            />
            <HelperText type="error" visible={!!errors.nextBillingDate}>
              {errors.nextBillingDate}
            </HelperText>

            {/* Cost Summary */}
            {formData.monthlyAmount && (
              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Cost Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Per {formData.billingCycle}:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(formData.monthlyAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Per year:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(formData.yearlyAmount)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading || !canAddMore}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          labelStyle={styles.submitButtonText}
        >
          {isLoading ? 'Adding Subscription...' : 'Add Subscription'}
        </Button>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    margin: 0,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  headerSpacer: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  warningCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    marginBottom: spacing.sm,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  billingRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  billingInput: {
    flex: 1,
  },
  cycleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cycleChip: {
    marginBottom: spacing.sm,
  },
  selectedCycleChip: {
    backgroundColor: colors.primary,
  },
  cycleChipText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  selectedCycleChipText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: colors.light,
    marginTop: spacing.md,
  },
  summaryContent: {
    paddingVertical: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

