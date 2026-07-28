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

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<LoginNavProp>();
  // Future API: useSignIn returns the signal-based { signIn } resource.
  // Password sign-in uses signIn.password(); session is activated via signIn.finalize().
  const { signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isSubmitting || !signIn) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { error } = await signIn.password({ identifier: email, password });
      if (error) {
        // console.error always shows in the browser console (react-native-web), unlike Alert.alert
        console.error('[Login] failed:', error);
        setErrorMsg(clerkErrorMessage(error, t, 'auth.loginError'));
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize();
      } else {
        console.error('[Login] incomplete, status:', signIn.status);
        setErrorMsg(t('auth.loginError'));
      }
    } catch (err: unknown) {
      // Future-API methods return { error }; a throw here is a transport/network failure.
      console.error('[Login] failed:', err);
      if (err instanceof Error && /network/i.test(err.message)) {
        setErrorMsg(t('auth.networkError'));
      } else {
        setErrorMsg(t('auth.loginError'));
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
              {t('auth.welcome')}
            </Typography>

            <Input
              testID="login-email-input"
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
              testID="login-password-input"
              containerStyle={{ marginBottom: Spacing.md }}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              leftIcon="lock"
            />

            {errorMsg && (
              <Typography
                testID="login-error"
                variant="bodySm"
                style={{ color: colors.error, marginBottom: Spacing.md }}
              >
                {errorMsg}
              </Typography>
            )}

            <Button
              testID="oidc-login-button"
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              iconRight="arrow-right"
              style={{ marginTop: Spacing.sm }}
            />

            <Button
              testID="forgot-password-link"
              title={t('auth.forgotPassword')}
              variant="ghost"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'center', marginTop: Spacing.sm }}
            />
          </Card>

          <View style={styles.footer}>
            <Typography variant="body" color="secondary">
              {t('auth.signUpPrompt')}{' '}
            </Typography>
            <Button
              testID="sign-up-link"
              title={t('auth.signUpLink')}
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('SignUp')}
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
