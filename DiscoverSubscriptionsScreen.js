import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, ProgressBar, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../utils/theme';

export default function DiscoverSubscriptionsScreen({ navigation }) {
  const { user } = useAuth();
  const { discoverSubscriptions, discoveryInProgress } = useSubscriptions();
  
  const [step, setStep] = useState('setup'); // setup, connecting, discovering, results
  const [includeBankData, setIncludeBankData] = useState(true);
  const [includeEmailData, setIncludeEmailData] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState({
    bank: null,
    email: null,
  });
  const [discoveredSubscriptions, setDiscoveredSubscriptions] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');

  const isFreeTier = user?.subscriptionTier === 'free';
  const canUseDiscovery = !isFreeTier || user?.subscriptionCount < 3;

  useEffect(() => {
    if (step === 'discovering') {
      simulateDiscoveryProgress();
    }
  }, [step]);

  const simulateDiscoveryProgress = () => {
    const steps = [
      { progress: 0.1, action: 'Connecting to your accounts...' },
      { progress: 0.3, action: 'Analyzing bank transactions...' },
      { progress: 0.5, action: 'Scanning email receipts...' },
      { progress: 0.7, action: 'Identifying subscription patterns...' },
      { progress: 0.9, action: 'Organizing discovered subscriptions...' },
      { progress: 1.0, action: 'Discovery complete!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        setCurrentAction(steps[currentStep].action);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStep('results');
          setDiscoveredSubscriptions([
            {
              id: 'discovered_1',
              name: 'YouTube Premium',
              category: 'Entertainment',
              monthlyAmount: 11.99,
              source: 'Bank Transaction',
              confidence: 'High',
              lastCharge: '2024-06-15',
            },
            {
              id: 'discovered_2',
              name: 'Dropbox Plus',
              category: 'Cloud Storage',
              monthlyAmount: 9.99,
              source: 'Email Receipt',
              confidence: 'High',
              lastCharge: '2024-06-20',
            },
            {
              id: 'discovered_3',
              name: 'The New York Times',
              category: 'News',
              monthlyAmount: 4.25,
              source: 'Bank Transaction',
              confidence: 'Medium',
              lastCharge: '2024-06-10',
            },
          ]);
        }, 1000);
      }
    }, 800);
  };

  const handleConnectBank = async () => {
    try {
      setCurrentAction('Connecting to your bank...');
      // In a real app, this would open Plaid Link
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectedAccounts(prev => ({
        ...prev,
        bank: {
          name: 'Chase Bank',
          accountType: 'Checking',
          lastFour: '1234',
        },
      }));
      
      Alert.alert('Success', 'Bank account connected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect bank account. Please try again.');
    }
  };

  const handleConnectEmail = async () => {
    try {
      setCurrentAction('Connecting to your email...');
      // In a real app, this would open Gmail OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnectedAccounts(prev => ({
        ...prev,
        email: {
          provider: 'Gmail',
          email: user?.email || 'user@example.com',
        },
      }));
      
      Alert.alert('Success', 'Email account connected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect email account. Please try again.');
    }
  };

  const handleStartDiscovery = async () => {
    if (!includeBankData && !includeEmailData) {
      Alert.alert('Error', 'Please select at least one data source for discovery.');
      return;
    }

    if (includeBankData && !connectedAccounts.bank) {
      Alert.alert('Error', 'Please connect your bank account first.');
      return;
    }

    if (includeEmailData && !connectedAccounts.email) {
      Alert.alert('Error', 'Please connect your email account first.');
      return;
    }

    setStep('discovering');
    setProgress(0);
  };

  const handleAddSubscription = (subscription) => {
    // Add the discovered subscription to the user's list
    Alert.alert(
      'Add Subscription',
      `Add ${subscription.name} to your subscriptions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => {
            // In a real app, this would call the subscription service
            Alert.alert('Success', `${subscription.name} added to your subscriptions!`);
            setDiscoveredSubscriptions(prev => 
              prev.filter(sub => sub.id !== subscription.id)
            );
          }
        },
      ]
    );
  };

  const renderSetupStep = () => (
    <ScrollView style={styles.content}>
      {/* Upgrade Prompt for Free Users */}
      {isFreeTier && !canUseDiscovery && (
        <Card style={styles.upgradeCard}>
          <Card.Content>
            <View style={styles.upgradeContent}>
              <Ionicons name="star" size={32} color={colors.warning} />
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeText}>
                You've reached the limit of 3 subscriptions on the free plan. 
                Upgrade to Pro to discover unlimited subscriptions.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Upgrade')}
                style={styles.upgradeButton}
                labelStyle={styles.upgradeButtonText}
              >
                Upgrade Now - $4.99/month
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Data Sources */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Choose Data Sources</Text>
          <Text style={styles.cardSubtitle}>
            Select which accounts to scan for subscriptions
          </Text>

          {/* Bank Account Option */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <View style={styles.optionInfo}>
                <Ionicons name="card" size={24} color={colors.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Bank Account</Text>
                  <Text style={styles.optionDescription}>
                    Scan transactions for recurring charges
                  </Text>
                </View>
              </View>
              <Switch
                value={includeBankData}
                onValueChange={setIncludeBankData}
                disabled={!canUseDiscovery}
              />
            </View>

            {includeBankData && (
              <View style={styles.connectionContainer}>
                {connectedAccounts.bank ? (
                  <View style={styles.connectedAccount}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.connectedText}>
                      {connectedAccounts.bank.name} (...{connectedAccounts.bank.lastFour})
                    </Text>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handleConnectBank}
                    style={styles.connectButton}
                    labelStyle={styles.connectButtonText}
                    icon="link"
                  >
                    Connect Bank Account
                  </Button>
                )}
              </View>
            )}
          </View>

          {/* Email Account Option */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <View style={styles.optionInfo}>
                <Ionicons name="mail" size={24} color={colors.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Email Account</Text>
                  <Text style={styles.optionDescription}>
                    Scan receipts and subscription emails
                  </Text>
                </View>
              </View>
              <Switch
                value={includeEmailData}
                onValueChange={setIncludeEmailData}
                disabled={!canUseDiscovery}
              />
            </View>

            {includeEmailData && (
              <View style={styles.connectionContainer}>
                {connectedAccounts.email ? (
                  <View style={styles.connectedAccount}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.connectedText}>
                      {connectedAccounts.email.email}
                    </Text>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handleConnectEmail}
                    style={styles.connectButton}
                    labelStyle={styles.connectButtonText}
                    icon="link"
                  >
                    Connect Email Account
                  </Button>
                )}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Privacy Notice */}
      <Card style={styles.privacyCard}>
        <Card.Content>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
          </View>
          <Text style={styles.privacyText}>
            • We use bank-level encryption to protect your data{'\n'}
            • Your login credentials are never stored{'\n'}
            • Data is processed securely and deleted after analysis{'\n'}
            • You can disconnect accounts anytime
          </Text>
        </Card.Content>
      </Card>

      {/* Start Discovery Button */}
      <Button
        mode="contained"
        onPress={handleStartDiscovery}
        disabled={!canUseDiscovery || (!includeBankData && !includeEmailData)}
        style={styles.startButton}
        contentStyle={styles.startButtonContent}
        labelStyle={styles.startButtonText}
      >
        Start Discovery
      </Button>
    </ScrollView>
  );

  const renderDiscoveringStep = () => (
    <View style={styles.discoveringContainer}>
      <View style={styles.discoveringContent}>
        <Ionicons name="search" size={80} color={colors.primary} />
        <Text style={styles.discoveringTitle}>Discovering Subscriptions</Text>
        <Text style={styles.discoveringText}>
          We're analyzing your accounts to find all your subscriptions. 
          This may take a few moments.
        </Text>
        
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
          <Text style={styles.progressText}>{Math.round(progress * 100)}% complete</Text>
        </View>
        
        <Text style={styles.currentAction}>{currentAction}</Text>
      </View>
    </View>
  );

  const renderResultsStep = () => (
    <ScrollView style={styles.content}>
      <View style={styles.resultsHeader}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={styles.resultsTitle}>Discovery Complete!</Text>
        <Text style={styles.resultsSubtitle}>
          We found {discoveredSubscriptions.length} potential subscriptions
        </Text>
      </View>

      {discoveredSubscriptions.map((subscription) => (
        <Card key={subscription.id} style={styles.subscriptionCard}>
          <Card.Content>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionName}>{subscription.name}</Text>
                <Text style={styles.subscriptionCategory}>{subscription.category}</Text>
              </View>
              <Text style={styles.subscriptionAmount}>
                ${subscription.monthlyAmount}/month
              </Text>
            </View>
            
            <View style={styles.subscriptionDetails}>
              <Chip 
                mode="outlined" 
                style={styles.sourceChip}
                textStyle={styles.chipText}
              >
                {subscription.source}
              </Chip>
              <Chip 
                mode="outlined" 
                style={[
                  styles.confidenceChip,
                  subscription.confidence === 'High' && styles.highConfidence,
                  subscription.confidence === 'Medium' && styles.mediumConfidence,
                ]}
                textStyle={styles.chipText}
              >
                {subscription.confidence} Confidence
              </Chip>
            </View>
            
            <Text style={styles.lastCharge}>
              Last charge: {new Date(subscription.lastCharge).toLocaleDateString()}
            </Text>
            
            <Button
              mode="contained"
              onPress={() => handleAddSubscription(subscription)}
              style={styles.addSubscriptionButton}
              labelStyle={styles.addSubscriptionButtonText}
            >
              Add to My Subscriptions
            </Button>
          </Card.Content>
        </Card>
      ))}

      {discoveredSubscriptions.length === 0 && (
        <Card style={styles.noResultsCard}>
          <Card.Content style={styles.noResultsContent}>
            <Ionicons name="search" size={48} color={colors.gray[400]} />
            <Text style={styles.noResultsTitle}>No New Subscriptions Found</Text>
            <Text style={styles.noResultsText}>
              We didn't find any new subscriptions in your connected accounts. 
              Your existing subscriptions are already being tracked.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.doneButton}
        labelStyle={styles.doneButtonText}
      >
        Done
      </Button>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Find Subscriptions</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {step === 'setup' && renderSetupStep()}
      {step === 'discovering' && renderDiscoveringStep()}
      {step === 'results' && renderResultsStep()}
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  upgradeCard: {
    backgroundColor: colors.warning,
    marginBottom: spacing.lg,
  },
  upgradeContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: spacing.sm,
  },
  upgradeText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
  },
  upgradeButtonText: {
    color: colors.warning,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  optionContainer: {
    marginBottom: spacing.lg,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  connectionContainer: {
    marginTop: spacing.md,
    marginLeft: 40,
  },
  connectedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 14,
    color: colors.success,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  connectButton: {
    borderColor: colors.primary,
    borderRadius: 8,
  },
  connectButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  privacyCard: {
    backgroundColor: colors.success,
    marginBottom: spacing.lg,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  privacyText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.9,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  startButtonContent: {
    paddingVertical: spacing.sm,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discoveringContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  discoveringContent: {
    alignItems: 'center',
  },
  discoveringTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  discoveringText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  currentAction: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.md,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: spacing.sm,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.md,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  subscriptionInfo: {
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
  subscriptionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subscriptionDetails: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sourceChip: {
    backgroundColor: colors.light,
  },
  confidenceChip: {
    backgroundColor: colors.light,
  },
  highConfidence: {
    backgroundColor: colors.success,
  },
  mediumConfidence: {
    backgroundColor: colors.warning,
  },
  chipText: {
    fontSize: 12,
  },
  lastCharge: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  addSubscriptionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  addSubscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  noResultsContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  doneButton: {
    borderColor: colors.primary,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  doneButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});

