import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: 'search',
    title: 'Discover Hidden Subscriptions',
    description: 'Connect your bank account and email to automatically find all your subscriptions in one place.',
    color: colors.primary,
  },
  {
    id: 2,
    icon: 'analytics',
    title: 'Track Your Spending',
    description: 'See exactly how much you\'re spending on subscriptions each month and year.',
    color: colors.success,
  },
  {
    id: 3,
    icon: 'notifications',
    title: 'Never Miss a Payment',
    description: 'Get notified before your subscriptions renew so you can cancel if needed.',
    color: colors.warning,
  },
  {
    id: 4,
    icon: 'shield-checkmark',
    title: 'Easy Cancellation',
    description: 'Cancel unwanted subscriptions directly through the app with our cancellation assistance.',
    color: colors.error,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      navigation.navigate('Auth', { screen: 'Register' });
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button onPress={handleSkip} labelStyle={styles.skipText}>
          Skip
        </Button>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.nextButtonText}
        >
          {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipText: {
    color: colors.gray[500],
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    backgroundColor: colors.gray[300],
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

