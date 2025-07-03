import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService, SUBSCRIPTION_TIERS } from '../../services/paymentService';
import { colors, spacing } from '../../utils/theme';

export default function UpgradeScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subscription, usage] = await Promise.all([
        paymentService.getCurrentSubscription(),
        paymentService.getUsageStats(),
      ]);
      
      setCurrentSubscription(subscription);
      setUsageStats(usage);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    }
  };

  const handleUpgrade = async () => {
    if (currentSubscription?.tier === 'pro') {
      // Already pro, open billing portal
      handleManageBilling();
      return;
    }

    setIsLoading(true);
    
    try {
      const priceId = SUBSCRIPTION_TIERS.pro.priceId;
      const successUrl = 'subzero://upgrade-success';
      const cancelUrl = 'subzero://upgrade-cancel';
      
      const session = await paymentService.createCheckoutSession(
        priceId,
        successUrl,
        cancelUrl
      );
      
      if (session.url) {
        // In a real app, this would open the Stripe checkout
        Alert.alert(
          'Upgrade to Pro',
          'This would open Stripe checkout in a real app. For demo purposes, we\'ll simulate a successful upgrade.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Upgrade', 
              onPress: () => simulateSuccessfulUpgrade()
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start upgrade process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateSuccessfulUpgrade = async () => {
    try {
      // Simulate successful upgrade
      await updateUser({
        ...user,
        subscriptionTier: 'pro',
      });
      
      setCurrentSubscription({
        tier: 'pro',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      Alert.alert(
        'Welcome to SubZero Pro! 🎉',
        'You now have access to all premium features including unlimited subscriptions, bill reminders, and spending alerts.',
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete upgrade. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    
    try {
      const returnUrl = 'subzero://billing-return';
      const session = await paymentService.createPortalSession(returnUrl);
      
      if (session.url) {
        Alert.alert(
          'Manage Billing',
          'This would open the Stripe billing portal in a real app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Pro subscription? You\'ll lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Pro', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: () => processCancellation()
        },
      ]
    );
  };

  const processCancellation = async () => {
    setIsLoading(true);
    
    try {
      const result = await paymentService.cancelSubscription('User requested cancellation');
      
      if (result.success) {
        setCurrentSubscription(prev => ({
          ...prev,
          status: 'cancelled',
          expiresAt: result.expiresAt,
        }));
        
        Alert.alert(
          'Subscription Cancelled',
          'Your Pro subscription has been cancelled. You\'ll continue to have access to Pro features until the end of your billing period.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeatureComparison = () => (
    <Card style={styles.comparisonCard}>
      <Card.Content>
        <Text style={styles.comparisonTitle}>Feature Comparison</Text>
        
        <View style={styles.comparisonHeader}>
          <View style={styles.featureColumn}>
            <Text style={styles.columnTitle}>Feature</Text>
          </View>
          <View style={styles.tierColumn}>
            <Text style={styles.columnTitle}>Free</Text>
          </View>
          <View style={styles.tierColumn}>
            <Text style={styles.columnTitle}>Pro</Text>
          </View>
        </View>

        <Divider style={styles.comparisonDivider} />

        {[
          { feature: 'Subscriptions', free: '3', pro: 'Unlimited' },
          { feature: 'Bill Reminders', free: '✗', pro: '✓' },
          { feature: 'Spending Alerts', free: '✗', pro: '✓' },
          { feature: 'Advanced Analytics', free: '✗', pro: '✓' },
          { feature: 'Export Data', free: '✗', pro: '✓' },
          { feature: 'Priority Support', free: '✗', pro: '✓' },
        ].map((item, index) => (
          <View key={index} style={styles.comparisonRow}>
            <View style={styles.featureColumn}>
              <Text style={styles.featureText}>{item.feature}</Text>
            </View>
            <View style={styles.tierColumn}>
              <Text style={[
                styles.tierText,
                item.free === '✗' && styles.unavailableText
              ]}>
                {item.free}
              </Text>
            </View>
            <View style={styles.tierColumn}>
              <Text style={[
                styles.tierText,
                styles.proText
              ]}>
                {item.pro}
              </Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderCurrentPlan = () => {
    if (!currentSubscription) return null;

    const isProUser = currentSubscription.tier === 'pro';
    const isCancelled = currentSubscription.status === 'cancelled';
    
    return (
      <Card style={[styles.currentPlanCard, isProUser && styles.proPlanCard]}>
        <Card.Content>
          <View style={styles.currentPlanHeader}>
            <View style={styles.currentPlanInfo}>
              <Text style={[styles.currentPlanTitle, isProUser && styles.proPlanTitle]}>
                Current Plan: {isProUser ? 'SubZero Pro' : 'Free'}
              </Text>
              {isProUser && (
                <Text style={[styles.currentPlanPrice, isProUser && styles.proPlanPrice]}>
                  $4.99/month
                </Text>
              )}
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: isCancelled ? colors.warning : colors.success }
            ]}>
              <Text style={styles.statusText}>
                {isCancelled ? 'CANCELLED' : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {isProUser && currentSubscription.expiresAt && (
            <Text style={[styles.expiryText, isProUser && styles.proExpiryText]}>
              {isCancelled ? 'Access until' : 'Renews on'}: {' '}
              {new Date(currentSubscription.expiresAt).toLocaleDateString()}
            </Text>
          )}

          {usageStats && (
            <View style={styles.usageStats}>
              <Text style={[styles.usageTitle, isProUser && styles.proUsageTitle]}>
                Current Usage
              </Text>
              <Text style={[styles.usageText, isProUser && styles.proUsageText]}>
                {usageStats.subscriptionsCount} of {' '}
                {isProUser ? '∞' : usageStats.subscriptionsLimit} subscriptions
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const isProUser = currentSubscription?.tier === 'pro';
  const isCancelled = currentSubscription?.status === 'cancelled';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            labelStyle={styles.backButtonText}
            icon="arrow-left"
          >
            Back
          </Button>
          <Text style={styles.headerTitle}>
            {isProUser ? 'Manage Subscription' : 'Upgrade to Pro'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {!isProUser && (
          <View style={styles.heroContent}>
            <Ionicons name="star" size={64} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Unlock Premium Features</Text>
            <Text style={styles.heroSubtitle}>
              Get unlimited subscriptions, smart reminders, and advanced analytics
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        {renderCurrentPlan()}

        {/* Pro Features */}
        {!isProUser && (
          <Card style={styles.featuresCard}>
            <Card.Content>
              <Text style={styles.featuresTitle}>SubZero Pro Features</Text>
              
              {SUBSCRIPTION_TIERS.pro.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Feature Comparison */}
        {renderFeatureComparison()}

        {/* Pricing */}
        {!isProUser && (
          <Card style={styles.pricingCard}>
            <Card.Content>
              <Text style={styles.pricingTitle}>Simple, Transparent Pricing</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>$4.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              
              <Text style={styles.pricingDescription}>
                Cancel anytime. No hidden fees. 7-day free trial for new users.
              </Text>
              
              <View style={styles.savingsContainer}>
                <Chip 
                  mode="flat" 
                  style={styles.savingsChip}
                  textStyle={styles.savingsChipText}
                >
                  Save $10 with annual billing
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!isProUser ? (
            <Button
              mode="contained"
              onPress={handleUpgrade}
              loading={isLoading}
              disabled={isLoading}
              style={styles.upgradeButton}
              contentStyle={styles.upgradeButtonContent}
              labelStyle={styles.upgradeButtonText}
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </Button>
          ) : (
            <View style={styles.proActions}>
              <Button
                mode="contained"
                onPress={handleManageBilling}
                loading={isLoading}
                disabled={isLoading}
                style={styles.manageButton}
                contentStyle={styles.manageButtonContent}
                labelStyle={styles.manageButtonText}
                icon="credit-card"
              >
                Manage Billing
              </Button>
              
              {!isCancelled && (
                <Button
                  mode="outlined"
                  onPress={handleCancelSubscription}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
                  icon="close-circle"
                >
                  Cancel Subscription
                </Button>
              )}
            </View>
          )}
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    margin: 0,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 80,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  currentPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  proPlanCard: {
    backgroundColor: colors.primary,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  proPlanTitle: {
    color: '#FFFFFF',
  },
  currentPlanPrice: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 2,
  },
  proPlanPrice: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  proExpiryText: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  usageStats: {
    backgroundColor: colors.light,
    padding: spacing.md,
    borderRadius: 12,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  proUsageTitle: {
    color: colors.primary,
  },
  usageText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  proUsageText: {
    color: colors.gray[700],
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: colors.dark,
    marginLeft: spacing.md,
    flex: 1,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  featureColumn: {
    flex: 2,
  },
  tierColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  comparisonDivider: {
    marginVertical: spacing.sm,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tierText: {
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
  },
  unavailableText: {
    color: colors.gray[400],
  },
  proText: {
    color: colors.success,
    fontWeight: '600',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 18,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  pricingDescription: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  savingsContainer: {
    alignItems: 'center',
  },
  savingsChip: {
    backgroundColor: colors.success,
  },
  savingsChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionContainer: {
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  upgradeButtonContent: {
    paddingVertical: spacing.md,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  proActions: {
    gap: spacing.md,
  },
  manageButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  manageButtonContent: {
    paddingVertical: spacing.sm,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: colors.error,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 16,
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  termsText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

