import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
  const { subscriptions } = useSubscriptions();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('6months');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    generateAnalytics();
  }, [subscriptions, timeRange]);

  const generateAnalytics = () => {
    if (!subscriptions.length) {
      setAnalytics(null);
      return;
    }

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const totalMonthly = activeSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);
    const totalYearly = totalMonthly * 12;

    // Category breakdown
    const categoryData = {};
    activeSubscriptions.forEach(sub => {
      const category = sub.category || 'Other';
      categoryData[category] = (categoryData[category] || 0) + sub.monthlyAmount;
    });

    // Monthly spending trend (mock data for demo)
    const monthlyTrend = [
      { month: 'Jan', amount: totalMonthly * 0.8 },
      { month: 'Feb', amount: totalMonthly * 0.9 },
      { month: 'Mar', amount: totalMonthly * 0.95 },
      { month: 'Apr', amount: totalMonthly },
      { month: 'May', amount: totalMonthly * 1.1 },
      { month: 'Jun', amount: totalMonthly },
    ];

    // Top subscriptions
    const topSubscriptions = activeSubscriptions
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
      .slice(0, 5);

    setAnalytics({
      totalMonthly,
      totalYearly,
      categoryData,
      monthlyTrend,
      topSubscriptions,
      averagePerSubscription: totalMonthly / activeSubscriptions.length,
      subscriptionCount: activeSubscriptions.length,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const chartConfig = {
    backgroundColor: colors.primary,
    backgroundGradientFrom: colors.primary,
    backgroundGradientTo: colors.secondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const renderOverviewCards = () => (
    <View style={styles.overviewContainer}>
      <Card style={styles.overviewCard}>
        <Card.Content style={styles.overviewContent}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={styles.overviewAmount}>
            {analytics ? formatCurrency(analytics.totalMonthly) : '$0'}
          </Text>
          <Text style={styles.overviewLabel}>Monthly Total</Text>
        </Card.Content>
      </Card>

      <Card style={styles.overviewCard}>
        <Card.Content style={styles.overviewContent}>
          <Ionicons name="trending-up" size={24} color={colors.success} />
          <Text style={styles.overviewAmount}>
            {analytics ? formatCurrency(analytics.totalYearly) : '$0'}
          </Text>
          <Text style={styles.overviewLabel}>Yearly Total</Text>
        </Card.Content>
      </Card>

      <Card style={styles.overviewCard}>
        <Card.Content style={styles.overviewContent}>
          <Ionicons name="apps" size={24} color={colors.warning} />
          <Text style={styles.overviewAmount}>
            {analytics ? analytics.subscriptionCount : 0}
          </Text>
          <Text style={styles.overviewLabel}>Active Subscriptions</Text>
        </Card.Content>
      </Card>

      <Card style={styles.overviewCard}>
        <Card.Content style={styles.overviewContent}>
          <Ionicons name="calculator" size={24} color={colors.secondary} />
          <Text style={styles.overviewAmount}>
            {analytics ? formatCurrency(analytics.averagePerSubscription || 0) : '$0'}
          </Text>
          <Text style={styles.overviewLabel}>Average Cost</Text>
        </Card.Content>
      </Card>
    </View>
  );

  const renderSpendingTrend = () => {
    if (!analytics?.monthlyTrend) return null;

    const data = {
      labels: analytics.monthlyTrend.map(item => item.month),
      datasets: [
        {
          data: analytics.monthlyTrend.map(item => item.amount),
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Spending Trend</Text>
          <LineChart
            data={data}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analytics?.categoryData) return null;

    const categories = Object.keys(analytics.categoryData);
    if (categories.length === 0) return null;

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    const data = categories.map((category, index) => ({
      name: category,
      amount: analytics.categoryData[category],
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={data}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderTopSubscriptions = () => {
    if (!analytics?.topSubscriptions?.length) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Top Subscriptions</Text>
          
          {analytics.topSubscriptions.map((subscription, index) => (
            <View key={subscription.id} style={styles.subscriptionRow}>
              <View style={styles.subscriptionRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionName}>{subscription.name}</Text>
                <Text style={styles.subscriptionCategory}>{subscription.category}</Text>
              </View>
              
              <View style={styles.subscriptionAmount}>
                <Text style={styles.amountText}>
                  {formatCurrency(subscription.monthlyAmount)}
                </Text>
                <Text style={styles.amountLabel}>per month</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderInsights = () => {
    if (!analytics) return null;

    const insights = [];
    
    if (analytics.totalMonthly > 100) {
      insights.push({
        icon: 'warning',
        color: colors.warning,
        title: 'High Monthly Spending',
        description: `You're spending ${formatCurrency(analytics.totalMonthly)} per month on subscriptions.`,
      });
    }

    if (analytics.subscriptionCount > 5) {
      insights.push({
        icon: 'apps',
        color: colors.primary,
        title: 'Many Subscriptions',
        description: `You have ${analytics.subscriptionCount} active subscriptions. Consider reviewing for unused services.`,
      });
    }

    insights.push({
      icon: 'trending-up',
      color: colors.success,
      title: 'Annual Impact',
      description: `Your subscriptions cost ${formatCurrency(analytics.totalYearly)} per year.`,
    });

    if (insights.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
                <Ionicons name={insight.icon} size={20} color="#FFFFFF" />
              </View>
              
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const isPro = user?.subscriptionTier === 'pro';

  if (!isPro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.upgradeContainer}>
          <Ionicons name="analytics" size={64} color={colors.gray[400]} />
          <Text style={styles.upgradeTitle}>Analytics Available with Pro</Text>
          <Text style={styles.upgradeDescription}>
            Get detailed insights into your subscription spending with charts, trends, and personalized recommendations.
          </Text>
          
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Upgrade')}
            style={styles.upgradeButton}
            contentStyle={styles.upgradeButtonContent}
            labelStyle={styles.upgradeButtonText}
          >
            Upgrade to Pro
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={colors.gray[400]} />
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptyDescription}>
            Add some subscriptions to see your spending analytics and insights.
          </Text>
          
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddSubscription')}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
            labelStyle={styles.addButtonText}
          >
            Add Subscription
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Insights into your subscription spending
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: '3months', label: '3M' },
              { key: '6months', label: '6M' },
              { key: '1year', label: '1Y' },
              { key: 'all', label: 'All' },
            ].map((range) => (
              <Chip
                key={range.key}
                mode={timeRange === range.key ? 'flat' : 'outlined'}
                selected={timeRange === range.key}
                onPress={() => setTimeRange(range.key)}
                style={[
                  styles.timeChip,
                  timeRange === range.key && styles.selectedTimeChip,
                ]}
                textStyle={[
                  styles.timeChipText,
                  timeRange === range.key && styles.selectedTimeChipText,
                ]}
              >
                {range.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Spending Trend Chart */}
        {renderSpendingTrend()}

        {/* Category Breakdown */}
        {renderCategoryBreakdown()}

        {/* Top Subscriptions */}
        {renderTopSubscriptions()}

        {/* Insights */}
        {renderInsights()}

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
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
  },
  timeRangeContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  timeChip: {
    marginRight: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  selectedTimeChip: {
    backgroundColor: colors.primary,
  },
  timeChipText: {
    color: colors.gray[600],
  },
  selectedTimeChipText: {
    color: '#FFFFFF',
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
  },
  overviewContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  overviewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  chart: {
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  subscriptionRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  subscriptionCategory: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  upgradeButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  addButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

