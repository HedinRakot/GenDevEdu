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
        setErrorMsg(error.longMessage ?? error.message ?? t('auth.loginError'));
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
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>EduCode</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {t('auth.tagline')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            {t('auth.welcome')}
          </Text>

          <TextInput
            testID="login-email-input"
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
            testID="login-password-input"
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
          />

          {errorMsg && (
            <Text testID="login-error" style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            testID="oidc-login-button"
            style={[
              styles.loginButton,
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverted} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.textInverted }]}>
                {t('auth.loginButton')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="forgot-password-link"
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('auth.signUpPrompt')}{' '}
          </Text>
          <TouchableOpacity testID="sign-up-link" onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('auth.signUpLink')}
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
  loginButton: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  loginButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  forgotPassword: { alignSelf: 'center', marginTop: Spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { fontSize: FontSize.md },
  linkText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
