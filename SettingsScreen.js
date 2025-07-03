import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Share } from 'react-native';
import { Text, Card, Button, Switch, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptions } from '../../contexts/SubscriptionContext';
import { notificationService } from '../../services/notificationService';
import { paymentService } from '../../services/paymentService';
import { colors, spacing } from '../../utils/theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { clearAllData } = useSubscriptions();
  
  const [settings, setSettings] = useState({
    notifications: true,
    billReminders: true,
    spendingAlerts: true,
    discoveryReminders: true,
    biometricAuth: false,
    darkMode: false,
    autoSync: true,
    dataSharing: false,
  });
  
  const [notificationStats, setNotificationStats] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadNotificationStats();
    loadSubscriptionInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadNotificationStats = async () => {
    try {
      const stats = await notificationService.getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const loadSubscriptionInfo = async () => {
    try {
      const subscription = await paymentService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await SecureStore.setItemAsync('userSettings', JSON.stringify(newSettings));
      
      // Handle specific setting changes
      if (key === 'notifications' && !value) {
        await notificationService.clearAllNotifications();
      }
      
      if (key === 'billReminders' || key === 'spendingAlerts') {
        // Refresh notification setup based on new preferences
        await loadNotificationStats();
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would generate and download a CSV/JSON file
      Alert.alert(
        'Export Data',
        'Your subscription data has been prepared for export. In a production app, this would download a CSV file with all your subscription information.',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This will permanently delete your account and all associated data. Type "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ACCOUNT',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Clear all local data
              await clearAllData();
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('userSettings');
              await notificationService.clearAllNotifications();
              
              // In production, this would call the API to delete the account
              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [{ text: 'OK', onPress: () => logout() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out SubZero - the best app for managing your subscriptions! Track spending, get bill reminders, and never miss a payment again.',
        url: 'https://subzero-app.com', // Your app's website
      });
    } catch (error) {
      console.error('Failed to share app:', error);
    }
  };

  const handleRateApp = () => {
    // In production, these would be the actual app store URLs
    const appStoreUrl = 'https://apps.apple.com/app/subzero';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.subzero.app';
    
    Alert.alert(
      'Rate SubZero',
      'Love using SubZero? Please rate us on the app store!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rate on App Store', onPress: () => Linking.openURL(appStoreUrl) },
      ]
    );
  };

  const handleContactSupport = () => {
    const email = 'support@subzero-app.com';
    const subject = 'SubZero Support Request';
    const body = `Hi SubZero Team,\n\nI need help with:\n\n[Please describe your issue]\n\nApp Version: ${Application.nativeApplicationVersion}\nUser ID: ${user?.id || 'N/A'}`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const isPro = currentSubscription?.tier === 'pro';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your preferences and account
          </Text>
        </View>

        {/* Account Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.accountInfo}>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{user?.name || 'User'}</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
                <View style={styles.accountTier}>
                  <Text style={[
                    styles.tierText,
                    isPro && styles.proTierText
                  ]}>
                    {isPro ? 'SubZero Pro' : 'Free Plan'}
                  </Text>
                  {!isPro && (
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('Upgrade')}
                      style={styles.upgradeButton}
                      labelStyle={styles.upgradeButtonText}
                      compact
                    >
                      Upgrade
                    </Button>
                  )}
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title="Manage Subscription"
              description={isPro ? "Billing and payment settings" : "Upgrade to Pro"}
              left={props => <List.Icon {...props} icon="credit-card" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Upgrade')}
              style={styles.listItem}
            />

            <List.Item
              title="Privacy & Security"
              description="Data protection and privacy settings"
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Privacy')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications from SubZero
                </Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSetting('notifications', value)}
                color={colors.primary}
              />
            </View>

            <View style={[
              styles.settingRow,
              !isPro && styles.disabledSetting
            ]}>
              <View style={styles.settingInfo}>
                <Text style={[
                  styles.settingTitle,
                  !isPro && styles.disabledText
                ]}>
                  Bill Reminders {!isPro && '(Pro)'}
                </Text>
                <Text style={[
                  styles.settingDescription,
                  !isPro && styles.disabledText
                ]}>
                  Get notified before bills are due
                </Text>
              </View>
              <Switch
                value={settings.billReminders && isPro}
                onValueChange={(value) => isPro && updateSetting('billReminders', value)}
                color={colors.primary}
                disabled={!isPro}
              />
            </View>

            <View style={[
              styles.settingRow,
              !isPro && styles.disabledSetting
            ]}>
              <View style={styles.settingInfo}>
                <Text style={[
                  styles.settingTitle,
                  !isPro && styles.disabledText
                ]}>
                  Spending Alerts {!isPro && '(Pro)'}
                </Text>
                <Text style={[
                  styles.settingDescription,
                  !isPro && styles.disabledText
                ]}>
                  Alerts when you exceed spending limits
                </Text>
              </View>
              <Switch
                value={settings.spendingAlerts && isPro}
                onValueChange={(value) => isPro && updateSetting('spendingAlerts', value)}
                color={colors.primary}
                disabled={!isPro}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Discovery Reminders</Text>
                <Text style={styles.settingDescription}>
                  Reminders to scan for new subscriptions
                </Text>
              </View>
              <Switch
                value={settings.discoveryReminders}
                onValueChange={(value) => updateSetting('discoveryReminders', value)}
                color={colors.primary}
              />
            </View>

            {notificationStats && (
              <View style={styles.notificationStats}>
                <Text style={styles.statsTitle}>Notification Status</Text>
                <Text style={styles.statsText}>
                  {notificationStats.total} scheduled notifications
                </Text>
                {isPro && (
                  <Text style={styles.statsText}>
                    {notificationStats.billReminders} bill reminders active
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* App Preferences */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync subscription data
                </Text>
              </View>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => updateSetting('autoSync', value)}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use Face ID or fingerprint to unlock
                </Text>
              </View>
              <Switch
                value={settings.biometricAuth}
                onValueChange={(value) => updateSetting('biometricAuth', value)}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme (coming soon)
                </Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => updateSetting('darkMode', value)}
                color={colors.primary}
                disabled={true}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Data & Privacy */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            
            <List.Item
              title="Export Data"
              description={isPro ? "Download your subscription data" : "Available with Pro"}
              left={props => <List.Icon {...props} icon="download" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={isPro ? handleExportData : () => navigation.navigate('Upgrade')}
              style={[styles.listItem, !isPro && styles.disabledListItem]}
              disabled={!isPro}
            />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Anonymous Analytics</Text>
                <Text style={styles.settingDescription}>
                  Help improve SubZero with usage data
                </Text>
              </View>
              <Switch
                value={settings.dataSharing}
                onValueChange={(value) => updateSetting('dataSharing', value)}
                color={colors.primary}
              />
            </View>

            <List.Item
              title="Privacy Policy"
              description="How we protect your data"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="open-in-new" />}
              onPress={() => Linking.openURL('https://subzero-app.com/privacy')}
              style={styles.listItem}
            />

            <List.Item
              title="Terms of Service"
              description="App usage terms and conditions"
              left={props => <List.Icon {...props} icon="file-document-outline" />}
              right={props => <List.Icon {...props} icon="open-in-new" />}
              onPress={() => Linking.openURL('https://subzero-app.com/terms')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Support & Feedback */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Support & Feedback</Text>
            
            <List.Item
              title="Contact Support"
              description="Get help with your account"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleContactSupport}
              style={styles.listItem}
            />

            <List.Item
              title="Rate SubZero"
              description="Leave a review on the app store"
              left={props => <List.Icon {...props} icon="star" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRateApp}
              style={styles.listItem}
            />

            <List.Item
              title="Share SubZero"
              description="Tell friends about the app"
              left={props => <List.Icon {...props} icon="share" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleShareApp}
              style={styles.listItem}
            />

            <List.Item
              title="What's New"
              description="Latest features and updates"
              left={props => <List.Icon {...props} icon="new-box" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('WhatsNew')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Information</Text>
            
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>
                Version: {Application.nativeApplicationVersion || '1.0.0'}
              </Text>
              <Text style={styles.appInfoText}>
                Build: {Application.nativeBuildVersion || '1'}
              </Text>
              <Text style={styles.appInfoText}>
                © 2024 SubZero. All rights reserved.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
            
            <Button
              mode="outlined"
              onPress={() => logout()}
              style={styles.logoutButton}
              labelStyle={styles.logoutButtonText}
              icon="logout"
            >
              Sign Out
            </Button>

            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              loading={isLoading}
              disabled={isLoading}
              style={styles.deleteButton}
              labelStyle={styles.deleteButtonText}
              icon="delete"
            >
              Delete Account
            </Button>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  accountInfo: {
    marginBottom: spacing.lg,
  },
  accountDetails: {
    gap: spacing.xs,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  accountTier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  proTierText: {
    color: colors.primary,
  },
  upgradeButton: {
    borderColor: colors.primary,
  },
  upgradeButtonText: {
    color: colors.primary,
    fontSize: 12,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  disabledListItem: {
    opacity: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  disabledSetting: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.gray[400],
  },
  notificationStats: {
    backgroundColor: colors.light,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  statsText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  appInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  appInfoText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
  dangerCard: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  dangerTitle: {
    color: colors.error,
  },
  logoutButton: {
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  logoutButtonText: {
    color: colors.warning,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

