import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSignUp } from '@clerk/expo';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadow, Spacing } from '@/config/theme';
import { Button, Card, Icon, Input, Typography } from '@/components/common';
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
          <View style={styles.stage}>
            <View style={styles.header}>
              <View style={[styles.logoBadge, { backgroundColor: colors.primarySurface }]}>
                <Icon name="mail" size={34} color={colors.accent} strokeWidth={1.75} />
              </View>
              <Typography variant="h2" center style={{ marginTop: Spacing.md }}>
                {t('auth.verifyEmailTitle')}
              </Typography>
              <Typography variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                {t('auth.verifyEmailInfo', { email })}
              </Typography>
            </View>

            <Card style={styles.card}>
              {errorMsg && (
                <Typography
                  testID="signup-error"
                  variant="bodySm"
                  style={{ color: colors.error, marginBottom: Spacing.md }}
                >
                  {errorMsg}
                </Typography>
              )}

              <Input
                testID="verification-code-input"
                containerStyle={{ marginBottom: Spacing.md }}
                placeholder={t('auth.verificationCodePlaceholder')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                leftIcon="message"
              />

              <Button
                testID="verify-button"
                title={t('auth.verifyButton')}
                onPress={handleVerify}
                loading={isSubmitting}
                disabled={isSubmitting}
                fullWidth
                iconRight="arrow-right"
                style={{ marginTop: Spacing.sm }}
              />
            </Card>
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
        <View style={styles.stage}>
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primarySurface }]}>
              <Icon name="logo" size={34} color={colors.accent} strokeWidth={1.75} />
            </View>
            <Typography variant="h1" style={{ marginTop: Spacing.md }}>
              EduCode
            </Typography>
            <Typography variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
              {t('auth.tagline')}
            </Typography>
          </View>

          <Card style={styles.card}>
            <Typography variant="h3" style={{ marginBottom: Spacing.lg }}>
              {t('auth.signUpTitle')}
            </Typography>

            <Input
              testID="signup-email-input"
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

            <Input
              testID="signup-password-input"
              containerStyle={{ marginBottom: Spacing.md }}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              leftIcon="lock"
            />

            <Input
              testID="signup-confirm-password-input"
              containerStyle={{ marginBottom: Spacing.md }}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              leftIcon="lock"
            />

            {errorMsg && (
              <Typography
                testID="signup-error"
                variant="bodySm"
                style={{ color: colors.error, marginBottom: Spacing.md }}
              >
                {errorMsg}
              </Typography>
            )}

            {/* clerk-captcha: required for Clerk's bot protection on web (nativeID maps to DOM id via react-native-web) */}
            <View nativeID="clerk-captcha" />

            <Button
              testID="signup-button"
              title={t('auth.signUpButton')}
              onPress={handleSignUp}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              iconRight="arrow-right"
              style={{ marginTop: Spacing.sm }}
            />
          </Card>

          <View style={styles.footer}>
            <Typography variant="body" color="secondary">
              {t('auth.loginPrompt')}{' '}
            </Typography>
            <Button
              testID="go-to-login-link"
              title={t('auth.loginLink')}
              variant="ghost"
              size="sm"
              onPress={() => navigation.goBack()}
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
