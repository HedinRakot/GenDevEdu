import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignUp } from '@clerk/expo';

import { useTheme } from '@/context/ThemeContext';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type SignUpNavProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export function SignUpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<SignUpNavProp>();
  // Future API: useSignUp returns the signal-based { signUp } resource.
  // Methods return { error } instead of throwing; session is activated via signUp.finalize().
  const { signUp } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (isSubmitting || !signUp) return;
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error: createError } = await signUp.create({ emailAddress: email, password });
      if (createError) {
        // console.error always shows in the browser console (react-native-web), unlike Alert.alert
        console.error('[SignUp] create failed:', createError);
        setErrorMsg(createError.longMessage ?? createError.message ?? t('auth.signUpError'));
        return;
      }
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        console.error('[SignUp] sendEmailCode failed:', sendError);
        setErrorMsg(sendError.longMessage ?? sendError.message ?? t('auth.signUpError'));
        return;
      }
      setPendingVerification(true);
    } catch (err: unknown) {
      // Future-API methods return { error }; a throw here is a transport/network failure.
      console.error('[SignUp] failed:', err);
      if (err instanceof Error && /network/i.test(err.message)) {
        setErrorMsg(t('auth.networkError'));
      } else {
        setErrorMsg(t('auth.signUpError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (isSubmitting || !signUp) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        console.error('[SignUp] verify failed:', error);
        setErrorMsg(error.longMessage ?? error.message ?? t('auth.verifyError'));
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize();
      } else {
        console.error('[SignUp] verify incomplete, status:', signUp.status);
        setErrorMsg(t('auth.verifyError'));
      }
    } catch (err: unknown) {
      console.error('[SignUp] verify failed:', err);
      setErrorMsg(t('auth.verifyError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>📧</Text>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
              {t('auth.verifyEmailTitle')}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t('auth.verifyEmailInfo', { email })}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {errorMsg && (
              <Text testID="signup-error" style={[styles.errorText, { color: colors.error }]}>
                {errorMsg}
              </Text>
            )}
            <TextInput
              testID="verification-code-input"
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder={t('auth.verificationCodePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />

            <TouchableOpacity
              accessibilityRole="button"
              testID="verify-button"
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleVerify}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverted} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.textInverted }]}>
                  {t('auth.verifyButton')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>EduCode</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {t('auth.tagline')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            {t('auth.signUpTitle')}
          </Text>

          <TextInput
            testID="signup-email-input"
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />

          <TextInput
            testID="signup-password-input"
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
          />

          <TextInput
            testID="signup-confirm-password-input"
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
          />

          {errorMsg && (
            <Text testID="signup-error" style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          )}

          {/* clerk-captcha: required for Clerk's bot protection on web (nativeID maps to DOM id via react-native-web) */}
          <View nativeID="clerk-captcha" />

          <TouchableOpacity
            accessibilityRole="button"
            testID="signup-button"
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverted} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.textInverted }]}>
                {t('auth.signUpButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('auth.loginPrompt')}{' '}
          </Text>
          <TouchableOpacity testID="go-to-login-link" onPress={() => navigation.goBack()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('auth.loginLink')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 64, marginBottom: Spacing.sm },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
  },
  tagline: { fontSize: FontSize.md, marginTop: Spacing.xs },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  infoText: { fontSize: FontSize.md, textAlign: 'center' },
  card: { borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.md },
  welcomeText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSize.sm, marginBottom: Spacing.md, fontWeight: FontWeight.semibold },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: FontSize.md,
  },
  primaryButton: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  primaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { fontSize: FontSize.md },
  linkText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
