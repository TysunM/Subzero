import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

const categories = ['All', 'Entertainment', 'Productivity', 'Cloud Storage', 'News', 'Fitness', 'Other'];
const statuses = ['All', 'Active', 'Cancelled', 'Paused'];

export default function SubscriptionsScreen({ navigation }) {
  const { user } = useAuth();
  const { subscriptions, isLoading, loadSubscriptions } = useSubscriptions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);

  const isFreeTier = user?.subscriptionTier === 'free';
  const subscriptionLimit = isFreeTier ? 3 : Infinity;
  const canAddMore = subscriptions.length < subscriptionLimit;

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, selectedCategory, selectedStatus]);

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(sub => sub.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(sub => sub.status === selectedStatus.toLowerCase());
    }

    setFilteredSubscriptions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  };

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

  const renderSubscriptionCard = ({ item: subscription }) => (
    <Card 
      style={styles.subscriptionCard}
      onPress={() => navigation.navigate('SubscriptionDetail', { subscription })}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionInfo}>
            <View style={[styles.subscriptionIcon, { backgroundColor: subscription.color || colors.primary }]}>
              <Ionicons 
                name={getSubscriptionIcon(subscription.name)} 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionName}>{subscription.name}</Text>
              <Text style={styles.subscriptionCategory}>{subscription.category}</Text>
              {subscription.description && (
                <Text style={styles.subscriptionDescription}>{subscription.description}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.subscriptionMeta}>
            <Text style={styles.subscriptionAmount}>
              {formatCurrency(subscription.monthlyAmount)}
            </Text>
            <Text style={styles.billingCycle}>
              /{subscription.billingCycle || 'month'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
              <Text style={styles.statusText}>{subscription.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.subscriptionFooter}>
          <View style={styles.nextBilling}>
            <Ionicons name="calendar" size={14} color={colors.gray[500]} />
            <Text style={styles.nextBillingText}>
              Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </Text>
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

        <View style={styles.cardActions}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('EditSubscription', { subscription })}
            labelStyle={styles.actionButtonText}
            compact
          >
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.navigate('CancelSubscription', { subscription })}
            labelStyle={[styles.actionButtonText, { color: colors.error }]}
            compact
          >
            Cancel
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="apps" size={64} color={colors.gray[400]} />
      <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
          ? 'Try adjusting your filters or search terms.'
          : 'Start by adding your first subscription or use the discovery feature to find them automatically.'
        }
      </Text>
      {!searchQuery && selectedCategory === 'All' && selectedStatus === 'All' && (
        <View style={styles.emptyActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddSubscription')}
            style={styles.emptyButton}
            labelStyle={styles.emptyButtonText}
            disabled={!canAddMore}
          >
            Add Subscription
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('DiscoverSubscriptions')}
            style={styles.emptyButton}
            labelStyle={styles.emptyOutlineButtonText}
          >
            Find Subscriptions
          </Button>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <Text style={styles.headerSubtitle}>
          {subscriptions.length} of {isFreeTier ? subscriptionLimit : '∞'} subscriptions
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search subscriptions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Text style={styles.filterLabel}>Category:</Text>
          {categories.map((category) => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.selectedFilterChip,
              ]}
              textStyle={[
                styles.filterChipText,
                selectedCategory === category && styles.selectedFilterChipText,
              ]}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Subscription List */}
      <FlatList
        data={filteredSubscriptions}
        renderItem={renderSubscriptionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Free Tier Limit Warning */}
      {isFreeTier && subscriptions.length >= subscriptionLimit && (
        <Card style={styles.limitWarning}>
          <Card.Content style={styles.limitWarningContent}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.limitWarningText}>
              You've reached the free plan limit. Upgrade to add more subscriptions.
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Upgrade')}
              labelStyle={styles.upgradeButtonText}
              compact
            >
              Upgrade
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          !canAddMore && styles.disabledFab,
        ]}
        onPress={() => navigation.navigate('AddSubscription')}
        disabled={!canAddMore}
        label={canAddMore ? "Add" : undefined}
      />
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
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: colors.gray[100],
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginRight: spacing.md,
    alignSelf: 'center',
    fontWeight: '500',
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  subscriptionCategory: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  subscriptionDescription: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  subscriptionMeta: {
    alignItems: 'flex-end',
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  billingCycle: {
    fontSize: 12,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextBilling: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBillingText: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  discoveryChip: {
    backgroundColor: colors.light,
  },
  discoveryChipText: {
    fontSize: 10,
    color: colors.gray[600],
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyActions: {
    gap: spacing.md,
    width: '100%',
  },
  emptyButton: {
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyOutlineButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  limitWarning: {
    margin: spacing.lg,
    backgroundColor: colors.warning,
  },
  limitWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  limitWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  disabledFab: {
    backgroundColor: colors.gray[400],
  },
});

