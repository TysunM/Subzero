import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { colors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - (spacing.lg * 2);

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { 
    subscriptions, 
    totalMonthlySpend, 
    upcomingBills, 
    isLoading, 
    loadSubscriptions,
    lastSyncDate 
  } = useSubscriptions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [subscriptions]);

  const loadAnalytics = async () => {
    // Mock analytics data based on subscriptions
    const monthlyData = [
      { month: 'Jan', amount: 78.46 },
      { month: 'Feb', amount: 84.46 },
      { month: 'Mar', amount: 84.46 },
      { month: 'Apr', amount: 84.46 },
      { month: 'May', amount: 84.46 },
      { month: 'Jun', amount: totalMonthlySpend || 84.46 },
    ];

    const categoryData = [
      { name: 'Entertainment', amount: 25.48, color: colors.primary, legendFontColor: colors.dark },
      { name: 'Productivity', amount: 52.99, color: colors.success, legendFontColor: colors.dark },
      { name: 'Cloud Storage', amount: 6.99, color: colors.warning, legendFontColor: colors.dark },
    ];

    setAnalytics({ monthlyData, categoryData });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  };

  const handleSyncAccounts = () => {
    navigation.navigate('DiscoverSubscriptions');
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
    };
    return iconMap[name] || 'apps';
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Avatar.Text 
                size={50} 
                label={user?.name?.charAt(0) || 'U'} 
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Account')}
                style={styles.settingsButton}
              >
                <Ionicons name="settings" size={24} color="#FFFFFF" />
              </Button>
            </View>
          </View>

          {/* Total Spending Card */}
          <Card style={styles.spendingCard}>
            <Card.Content style={styles.spendingContent}>
              <Text style={styles.spendingLabel}>Total monthly spend</Text>
              <Text style={styles.spendingAmount}>
                {formatCurrency(totalMonthlySpend)}
              </Text>
              
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Subscriptions', { screen: 'AddSubscription' })}
                  style={styles.addButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.addButtonText}
                  icon="plus"
                >
                  Add Subscription
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleSyncAccounts}
                  style={styles.syncButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.syncButtonText}
                  icon="sync"
                >
                  Sync Accounts
                </Button>
              </View>
            </Card.Content>
          </Card>
        </LinearGradient>

        {/* Subscription Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscription Overview</Text>
            <Text style={styles.activeCount}>{subscriptions.length} active</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subscriptionList}>
            {subscriptions.slice(0, 8).map((subscription) => (
              <Card key={subscription.id} style={styles.subscriptionCard}>
                <Card.Content style={styles.subscriptionContent}>
                  <View style={[styles.subscriptionIcon, { backgroundColor: subscription.color || colors.primary }]}>
                    <Ionicons 
                      name={getSubscriptionIcon(subscription.name)} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <Text style={styles.subscriptionName}>{subscription.name}</Text>
                  <Text style={styles.subscriptionAmount}>
                    {formatCurrency(subscription.monthlyAmount)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
            
            {subscriptions.length > 8 && (
              <Card style={styles.moreCard}>
                <Card.Content style={styles.moreContent}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Subscriptions')}
                    labelStyle={styles.moreText}
                  >
                    +{subscriptions.length - 8} more
                  </Button>
                </Card.Content>
              </Card>
            )}
          </ScrollView>
        </View>

        {/* Spending Chart */}
        {analytics?.monthlyData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Trend</Text>
            <Card style={styles.chartCard}>
              <Card.Content>
                <LineChart
                  data={{
                    labels: analytics.monthlyData.map(item => item.month),
                    datasets: [{
                      data: analytics.monthlyData.map(item => item.amount),
                    }],
                  }}
                  width={chartWidth - 32}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Category Breakdown */}
        {analytics?.categoryData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <Card style={styles.chartCard}>
              <Card.Content>
                <PieChart
                  data={analytics.categoryData}
                  width={chartWidth - 32}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Upcoming Bills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Subscriptions')}
              labelStyle={styles.viewAllText}
              compact
            >
              View All
            </Button>
          </View>

          {upcomingBills.slice(0, 3).map((bill) => (
            <Card key={bill.id} style={styles.billCard}>
              <Card.Content style={styles.billContent}>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billDate}>
                    {bill.daysUntil === 0 ? 'Today' : 
                     bill.daysUntil === 1 ? 'Tomorrow' : 
                     `${bill.daysUntil} days`}
                  </Text>
                </View>
                <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Last Sync Info */}
        {lastSyncDate && (
          <View style={styles.syncInfo}>
            <Text style={styles.syncText}>
              Last synced: {new Date(lastSyncDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userDetails: {
    marginLeft: spacing.md,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  settingsButton: {
    margin: 0,
  },
  spendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  spendingContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  spendingLabel: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  spendingAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  syncButton: {
    borderColor: colors.primary,
    borderRadius: 12,
  },
  buttonContent: {
    paddingHorizontal: spacing.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  syncButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  activeCount: {
    fontSize: 14,
    color: colors.gray[500],
  },
  subscriptionList: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  subscriptionCard: {
    width: 100,
    marginRight: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  subscriptionContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscriptionName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subscriptionAmount: {
    fontSize: 11,
    color: colors.gray[600],
  },
  moreCard: {
    width: 100,
    backgroundColor: colors.gray[100],
    borderRadius: 16,
  },
  moreContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  moreText: {
    color: colors.gray[600],
    fontSize: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chart: {
    borderRadius: 16,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  billContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  billDate: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
  },
  syncInfo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});

