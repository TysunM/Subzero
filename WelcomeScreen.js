import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="flash" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>SubZero</Text>
            <Text style={styles.tagline}>Take control of your subscriptions</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.feature}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>Discover hidden subscriptions</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="analytics" size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>Track your spending</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>Never miss a payment</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              <Text style={styles.featureText}>Cancel unwanted subscriptions</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.primaryButtonText}
            >
              Get Started
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.secondaryButtonText}
            >
              I already have an account
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  featuresSection: {
    marginVertical: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: spacing.md,
    opacity: 0.9,
  },
  actionSection: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  secondaryButton: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

