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
import { useSignIn } from '@clerk/expo';

import { useTheme } from '@/context/ThemeContext';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type ForgotPasswordNavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordNavProp>();
  // Future API: useSignIn returns the signal-based { signIn } resource.
  // Reset flow: create({ identifier }) → resetPasswordEmailCode.sendCode() →
  // verifyCode({ code }) (status → 'needs_new_password') → submitPassword() → finalize().
  const { signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (isSubmitting || !signIn) return;
    if (!email) {
      setErrorMsg(t('auth.fieldsRequired'));
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // Establish the sign-in attempt with the identifier so the reset code
      // can be sent to the account's email address.
      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) {
        // console.error always shows in the browser console (react-native-web), unlike Alert.alert
        console.error('[ForgotPassword] create failed:', createError);
        setErrorMsg(createError.longMessage ?? createError.message ?? t('auth.resetPasswordError'));
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        console.error('[ForgotPassword] sendCode failed:', sendError);
        setErrorMsg(sendError.longMessage ?? sendError.message ?? t('auth.resetPasswordError'));
        return;
      }
      setPendingReset(true);
    } catch (err: unknown) {
      // Future-API methods return { error }; a throw here is a transport/network failure.
      console.error('[ForgotPassword] sendCode failed:', err);
      if (err instanceof Error && /network/i.test(err.message)) {
        setErrorMsg(t('auth.networkError'));
      } else {
        setErrorMsg(t('auth.resetPasswordError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (isSubmitting || !signIn) return;
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch'));
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyError) {
        console.error('[ForgotPassword] verifyCode failed:', verifyError);
        setErrorMsg(verifyError.longMessage ?? verifyError.message ?? t('auth.verifyError'));
        return;
      }
      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (submitError) {
        console.error('[ForgotPassword] submitPassword failed:', submitError);
        setErrorMsg(submitError.longMessage ?? submitError.message ?? t('auth.resetPasswordError'));
        return;
      }
      if (signIn.status === 'complete') {
        // Password reset succeeded; activate the new session (auto sign-in).
        await signIn.finalize();
      } else {
        console.error('[ForgotPassword] incomplete, status:', signIn.status);
        setErrorMsg(t('auth.resetPasswordError'));
      }
    } catch (err: unknown) {
      console.error('[ForgotPassword] reset failed:', err);
      if (err instanceof Error && /network/i.test(err.message)) {
        setErrorMsg(t('auth.networkError'));
      } else {
        setErrorMsg(t('auth.resetPasswordError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>{pendingReset ? '🔑' : '🔒'}</Text>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            {t('auth.forgotPasswordTitle')}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {pendingReset
              ? t('auth.resetCodeSentInfo', { email })
              : t('auth.forgotPasswordInfo')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {errorMsg && (
            <Text testID="forgot-password-error" style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          )}

          {!pendingReset ? (
            <>
              <TextInput
                testID="forgot-password-email-input"
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

              <TouchableOpacity
                accessibilityRole="button"
                testID="send-reset-code-button"
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleSendCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textInverted} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.textInverted }]}>
                    {t('auth.sendResetCodeButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                testID="reset-code-input"
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

              <TextInput
                testID="reset-new-password-input"
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder={t('auth.newPasswordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />

              <TextInput
                testID="reset-confirm-password-input"
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

              <TouchableOpacity
                accessibilityRole="button"
                testID="reset-password-button"
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleResetPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textInverted} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.textInverted }]}>
                    {t('auth.resetPasswordButton')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity testID="back-to-login-link" onPress={() => navigation.goBack()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('auth.backToLogin')}
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
  screenTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  infoText: { fontSize: FontSize.md, textAlign: 'center' },
  card: { borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.md },
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
  linkText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
