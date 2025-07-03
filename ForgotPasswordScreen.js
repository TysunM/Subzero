import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { colors, spacing } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setSnackbarMessage('Please enter your email address');
      setSnackbarVisible(true);
      return;
    }

    if (!email.includes('@')) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarVisible(true);
      return;
    }

    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setIsSuccess(true);
      setSnackbarMessage('Password reset email sent successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to send reset email');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
          >
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              labelStyle={styles.backButtonText}
              icon="arrow-left"
            >
              Back
            </Button>
            
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.titleText}>Forgot Password?</Text>
            <Text style={styles.subtitleText}>
              No worries! Enter your email and we'll send you a reset link.
            </Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            {!isSuccess ? (
              <View style={styles.form}>
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />

                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.resetButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.resetButtonText}
                >
                  Send Reset Link
                </Button>

                <View style={styles.helpContainer}>
                  <Text style={styles.helpText}>
                    Remember your password?{' '}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Login')}
                    labelStyle={styles.loginButtonText}
                    compact
                  >
                    Sign In
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                </View>
                
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  We've sent a password reset link to {email}. 
                  Please check your email and follow the instructions to reset your password.
                </Text>

                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backToLoginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.resetButtonText}
                >
                  Back to Sign In
                </Button>

                <Button
                  mode="text"
                  onPress={() => setIsSuccess(false)}
                  labelStyle={styles.resendButtonText}
                >
                  Didn't receive the email? Try again
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={[styles.snackbar, isSuccess && styles.successSnackbar]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  iconContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  helpText: {
    color: colors.gray[600],
    fontSize: 16,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  backToLoginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: spacing.lg,
    width: '100%',
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: colors.error,
  },
  successSnackbar: {
    backgroundColor: colors.success,
  },
});

