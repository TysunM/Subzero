import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import SubscriptionsScreen from '../screens/main/SubscriptionsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import AccountScreen from '../screens/main/AccountScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Additional Screens
import AddSubscriptionScreen from '../screens/main/AddSubscriptionScreen';
import EditSubscriptionScreen from '../screens/main/EditSubscriptionScreen';
import SubscriptionDetailScreen from '../screens/main/SubscriptionDetailScreen';
import DiscoverSubscriptionsScreen from '../screens/main/DiscoverSubscriptionsScreen';
import CancelSubscriptionScreen from '../screens/main/CancelSubscriptionScreen';
import UpgradeScreen from '../screens/main/UpgradeScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DiscoverSubscriptions" 
        component={DiscoverSubscriptionsScreen}
        options={{ 
          title: 'Find Subscriptions',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="Upgrade" 
        component={UpgradeScreen}
        options={{ 
          title: 'Upgrade to Pro',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}

function SubscriptionsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SubscriptionsMain" 
        component={SubscriptionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddSubscription" 
        component={AddSubscriptionScreen}
        options={{ 
          title: 'Add Subscription',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="EditSubscription" 
        component={EditSubscriptionScreen}
        options={{ 
          title: 'Edit Subscription',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="SubscriptionDetail" 
        component={SubscriptionDetailScreen}
        options={{ 
          title: 'Subscription Details',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="CancelSubscription" 
        component={CancelSubscriptionScreen}
        options={{ 
          title: 'Cancel Subscription',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AccountMain" 
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Subscriptions" 
        component={SubscriptionsStack}
        options={{ title: 'Subscriptions' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountStack}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
}

