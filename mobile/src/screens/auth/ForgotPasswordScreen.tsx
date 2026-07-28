import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignIn } from '@clerk/expo';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadow, Spacing } from '@/config/theme';
import { Button, Card, Icon, Input, Typography } from '@/components/common';
import { clerkErrorMessage } from '@/utils/clerkError';
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
        setErrorMsg(clerkErrorMessage(createError, t, 'auth.resetPasswordError'));
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        console.error('[ForgotPassword] sendCode failed:', sendError);
        setErrorMsg(clerkErrorMessage(sendError, t, 'auth.resetPasswordError'));
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
        setErrorMsg(clerkErrorMessage(verifyError, t, 'auth.verifyError'));
        return;
      }
      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (submitError) {
        console.error('[ForgotPassword] submitPassword failed:', submitError);
        setErrorMsg(clerkErrorMessage(submitError, t, 'auth.resetPasswordError'));
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
        <View style={styles.stage}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primarySurface }]}>
              <Icon name={pendingReset ? 'mail' : 'lock'} size={34} color={colors.accent} />
            </View>
            <Typography variant="h1" center style={{ marginTop: Spacing.md }}>
              {t('auth.forgotPasswordTitle')}
            </Typography>
            <Typography variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
              {pendingReset ? t('auth.resetCodeSentInfo', { email }) : t('auth.forgotPasswordInfo')}
            </Typography>
          </View>

          <Card style={styles.card}>
            {errorMsg && (
              <Typography
                testID="forgot-password-error"
                variant="bodySm"
                style={{ color: colors.error, marginBottom: Spacing.md }}
              >
                {errorMsg}
              </Typography>
            )}

            {!pendingReset ? (
              <>
                <Input
                  testID="forgot-password-email-input"
                  containerStyle={{ marginBottom: Spacing.md }}
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  leftIcon="mail"
                />

                <Button
                  testID="send-reset-code-button"
                  title={t('auth.sendResetCodeButton')}
                  onPress={handleSendCode}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  iconRight="arrow-right"
                  style={{ marginTop: Spacing.sm }}
                />
              </>
            ) : (
              <>
                <Input
                  testID="reset-code-input"
                  containerStyle={{ marginBottom: Spacing.md }}
                  placeholder={t('auth.verificationCodePlaceholder')}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  leftIcon="lock"
                />

                <Input
                  testID="reset-new-password-input"
                  containerStyle={{ marginBottom: Spacing.md }}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  leftIcon="lock"
                />

                <Input
                  testID="reset-confirm-password-input"
                  containerStyle={{ marginBottom: Spacing.md }}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  leftIcon="lock"
                />

                <Button
                  testID="reset-password-button"
                  title={t('auth.resetPasswordButton')}
                  onPress={handleResetPassword}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  iconRight="arrow-right"
                  style={{ marginTop: Spacing.sm }}
                />
              </>
            )}
          </Card>

          <View style={styles.footer}>
            <Button
              testID="back-to-login-link"
              title={t('auth.backToLogin')}
              variant="ghost"
              onPress={() => navigation.goBack()}
              iconLeft="arrow-left"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  stage: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  card: { padding: Spacing.xl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
