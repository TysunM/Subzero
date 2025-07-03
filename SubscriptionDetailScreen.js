import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { colors, spacing } from '../../utils/theme';

export default function SubscriptionDetailScreen({ navigation, route }) {
  const { subscription } = route.params;
  const { deleteSubscription } = useSubscriptions();
  
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSubscriptionIcon = (name) => {
    const iconMap = {
      'Netflix': 'tv',
      'Spotify': 'musical-notes',
      'Adobe Creative Cloud': 'brush',
      'OneDrive': 'cloud',
      'YouTube Premium': 'logo-youtube',
      'Dropbox': 'folder',
      'The New York Times': 'newspaper',
    };
    return iconMap[name] || 'apps';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'cancelled': return colors.error;
      case 'paused': return colors.warning;
      default: return colors.gray[500];
    }
  };

  const getDaysUntilBilling = () => {
    const today = new Date();
    const billingDate = new Date(subscription.nextBillingDate);
    const diffTime = billingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEdit = () => {
    navigation.navigate('EditSubscription', { subscription });
  };

  const handleCancel = () => {
    navigation.navigate('CancelSubscription', { subscription });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete ${subscription.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteSubscription(subscription.id);
              Alert.alert(
                'Success',
                'Subscription deleted successfully.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subscription. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenWebsite = () => {
    if (subscription.website) {
      const url = subscription.website.startsWith('http') 
        ? subscription.website 
        : `https://${subscription.website}`;
      Linking.openURL(url);
    }
  };

  const daysUntilBilling = getDaysUntilBilling();
  const billingStatus = daysUntilBilling <= 3 ? 'urgent' : daysUntilBilling <= 7 ? 'soon' : 'normal';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[subscription.color || colors.primary, colors.secondary]}
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
          
          <Button
            mode="text"
            onPress={handleEdit}
            style={styles.editButton}
            labelStyle={styles.editButtonText}
            icon="pencil"
          >
            Edit
          </Button>
        </View>

        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionIcon}>
            <Ionicons 
              name={getSubscriptionIcon(subscription.name)} 
              size={48} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionName}>{subscription.name}</Text>
            <Text style={styles.subscriptionCategory}>{subscription.category}</Text>
            {subscription.description && (
              <Text style={styles.subscriptionDescription}>{subscription.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
            <Text style={styles.statusText}>{subscription.status.toUpperCase()}</Text>
          </View>
          
          {subscription.discoveredVia && (
            <Chip 
              mode="outlined" 
              style={styles.discoveryChip}
              textStyle={styles.discoveryChipText}
            >
              Found via {subscription.discoveredVia}
            </Chip>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Billing Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Billing Information</Text>
            
            <View style={styles.billingRow}>
              <View style={styles.billingItem}>
                <Text style={styles.billingLabel}>Monthly Cost</Text>
                <Text style={styles.billingValue}>
                  {formatCurrency(subscription.monthlyAmount)}
                </Text>
              </View>
              
              <View style={styles.billingItem}>
                <Text style={styles.billingLabel}>Yearly Cost</Text>
                <Text style={styles.billingValue}>
                  {formatCurrency(subscription.yearlyAmount || subscription.monthlyAmount * 12)}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.billingDetail}>
              <View style={styles.billingDetailRow}>
                <Ionicons name="calendar" size={20} color={colors.gray[600]} />
                <View style={styles.billingDetailText}>
                  <Text style={styles.billingDetailLabel}>Next Billing Date</Text>
                  <Text style={[
                    styles.billingDetailValue,
                    billingStatus === 'urgent' && styles.urgentBilling,
                    billingStatus === 'soon' && styles.soonBilling,
                  ]}>
                    {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={[
                    styles.billingDays,
                    billingStatus === 'urgent' && styles.urgentBilling,
                    billingStatus === 'soon' && styles.soonBilling,
                  ]}>
                    {daysUntilBilling === 0 ? 'Today' :
                     daysUntilBilling === 1 ? 'Tomorrow' :
                     `${daysUntilBilling} days away`}
                  </Text>
                </View>
              </View>

              <View style={styles.billingDetailRow}>
                <Ionicons name="refresh" size={20} color={colors.gray[600]} />
                <View style={styles.billingDetailText}>
                  <Text style={styles.billingDetailLabel}>Billing Cycle</Text>
                  <Text style={styles.billingDetailValue}>
                    {subscription.billingCycle || 'Monthly'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Usage Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.floor((Date.now() - new Date('2024-01-01')) / (1000 * 60 * 60 * 24 * 30))}
                </Text>
                <Text style={styles.statLabel}>Months Active</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(subscription.monthlyAmount * Math.floor((Date.now() - new Date('2024-01-01')) / (1000 * 60 * 60 * 24 * 30)))}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(subscription.monthlyAmount * 12)}
                </Text>
                <Text style={styles.statLabel}>Annual Cost</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Subscription Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            
            {subscription.website && (
              <View style={styles.detailRow}>
                <Ionicons name="globe" size={20} color={colors.gray[600]} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Website</Text>
                  <Button
                    mode="text"
                    onPress={handleOpenWebsite}
                    labelStyle={styles.websiteLink}
                    compact
                  >
                    {subscription.website}
                  </Button>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="pricetag" size={20} color={colors.gray[600]} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{subscription.category}</Text>
              </View>
            </View>

            {subscription.discoveredVia && (
              <View style={styles.detailRow}>
                <Ionicons name="search" size={20} color={colors.gray[600]} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Discovery Method</Text>
                  <Text style={styles.detailValue}>
                    Found via {subscription.discoveredVia === 'bank' ? 'bank transactions' : 'email receipts'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={colors.gray[600]} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Added</Text>
                <Text style={styles.detailValue}>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleEdit}
                style={styles.actionButton}
                labelStyle={styles.actionButtonText}
                icon="pencil"
              >
                Edit Subscription
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={[styles.actionButton, styles.cancelButton]}
                labelStyle={[styles.actionButtonText, styles.cancelButtonText]}
                icon="close-circle"
              >
                Cancel Subscription
              </Button>
              
              <Button
                mode="text"
                onPress={handleDelete}
                loading={isLoading}
                disabled={isLoading}
                style={styles.deleteButton}
                labelStyle={styles.deleteButtonText}
                icon="trash"
              >
                Delete from App
              </Button>
            </View>
          </Card.Content>
        </Card>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    margin: 0,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  editButton: {
    margin: 0,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subscriptionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subscriptionCategory: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  discoveryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  discoveryChipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  billingItem: {
    alignItems: 'center',
  },
  billingLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  billingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  billingDetail: {
    gap: spacing.lg,
  },
  billingDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  billingDetailText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  billingDetailLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  billingDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  billingDays: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  urgentBilling: {
    color: colors.error,
  },
  soonBilling: {
    color: colors.warning,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  detailText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.dark,
  },
  websiteLink: {
    color: colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  actionButtons: {
    gap: spacing.md,
  },
  actionButton: {
    borderColor: colors.primary,
    borderRadius: 12,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  cancelButton: {
    borderColor: colors.warning,
  },
  cancelButtonText: {
    color: colors.warning,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

