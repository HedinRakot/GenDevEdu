import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { saveLanguage } from '@/store/storage';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  cancelStreakReminder,
  isStreakReminderEnabled,
  scheduleDailyStreakReminder,
} from '@/services/notifications';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

interface SettingsRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  isLast?: boolean;
  variant?: 'default' | 'danger';
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  trailing,
  isLast,
  variant = 'default',
}: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={!onPress && !trailing}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor:
              variant === 'danger' ? colors.errorSurface : colors.surfaceElevated,
          },
        ]}
      >
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            { color: variant === 'danger' ? colors.error : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
        )}
      </View>
      {trailing ?? (onPress && <Text style={[styles.rowArrow, { color: colors.textTertiary }]}>›</Text>)}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, logout } = useAuth();
  const { colors, mode, setMode, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const currentLang = i18nInstance.language as SupportedLanguage;
  const [notificationsOn, setNotificationsOn] = useState(false);

  const isAuthor = user?.role === 'instructor' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    isStreakReminderEnabled().then(setNotificationsOn);
  }, []);

  const changeLanguage = async (lang: SupportedLanguage) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logoutConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const toggleDarkMode = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const toggleSystemTheme = () => {
    setMode(mode === 'system' ? (isDark ? 'dark' : 'light') : 'system');
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const id = await scheduleDailyStreakReminder();
      if (!id) {
        Alert.alert(t('settings.notifications.permissionDenied'));
        return;
      }
      setNotificationsOn(true);
    } else {
      await cancelStreakReminder();
      setNotificationsOn(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
          {t('settings.title')}
        </Text>

        {user && (
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.profileAvatarText}>
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user.name || user.email}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  {user.role === 'instructor'
                    ? '✏️ Author'
                    : user.role === 'admin'
                      ? '🛡️ Admin'
                      : '🎓 Student'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sprache */}
        <SettingsSection title={t('settings.language.title')}>
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <SettingsRow
              key={lang.code}
              icon={lang.flag}
              label={lang.nativeName}
              isLast={index === SUPPORTED_LANGUAGES.length - 1}
              trailing={
                <View
                  style={[
                    styles.langRadio,
                    { borderColor: currentLang === lang.code ? colors.primary : colors.border },
                  ]}
                >
                  {currentLang === lang.code && (
                    <View style={[styles.langRadioDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              }
              onPress={() => changeLanguage(lang.code)}
            />
          ))}
        </SettingsSection>

        {/* Darstellung */}
        <SettingsSection title={t('settings.appearance.title')}>
          <SettingsRow
            icon="🌙"
            label={t('settings.appearance.darkMode')}
            subtitle={t('settings.appearance.darkModeSubtitle')}
            trailing={
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                disabled={mode === 'system'}
              />
            }
          />
          <SettingsRow
            icon="📱"
            label={t('settings.appearance.followSystem')}
            subtitle={t('settings.appearance.followSystemSubtitle')}
            isLast
            trailing={
              <Switch
                value={mode === 'system'}
                onValueChange={toggleSystemTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title={t('settings.notifications.title')}>
          <SettingsRow
            icon="🔔"
            label={t('settings.notifications.streakReminder')}
            subtitle={t('settings.notifications.streakReminderSubtitle')}
            isLast
            trailing={
              <Switch
                value={notificationsOn}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SettingsSection>

        {/* Lerntools */}
        <SettingsSection title={t('settings.tools.title')}>
          <SettingsRow
            icon="📖"
            label={t('glossary.title')}
            subtitle={t('glossary.subtitle')}
            onPress={() => navigation.navigate('Courses', { screen: 'Glossary' })}
          />
          <SettingsRow
            icon="📌"
            label={t('snippets.title')}
            subtitle={t('snippets.subtitle')}
            onPress={() => navigation.navigate('Snippets')}
            isLast
          />
        </SettingsSection>

        {/* Verwaltung (rollenabhängig) */}
        {(isAuthor || isAdmin) && (
          <SettingsSection title={t('settings.management.title')}>
            {isAuthor && (
              <SettingsRow
                icon="✏️"
                label={t('settings.management.author')}
                subtitle={t('settings.management.authorSubtitle')}
                onPress={() => navigation.navigate('Author')}
                isLast={!isAdmin}
              />
            )}
            {isAdmin && (
              <SettingsRow
                icon="🛡️"
                label={t('settings.management.admin')}
                subtitle={t('settings.management.adminSubtitle')}
                onPress={() => navigation.navigate('Admin')}
                isLast
              />
            )}
          </SettingsSection>
        )}

        {/* Konto */}
        <SettingsSection title={t('settings.account.title')}>
          <SettingsRow
            icon="🚪"
            label={t('settings.account.logoutButton')}
            onPress={handleLogout}
            isLast
            variant="danger"
          />
        </SettingsSection>

        {/* Über die App */}
        <SettingsSection title={t('settings.about.title')}>
          <SettingsRow
            icon="📱"
            label={t('settings.about.appName')}
            subtitle={t('settings.about.version', { version: '1.0.0' })}
            isLast
          />
        </SettingsSection>

        <View style={[styles.devInfo, { backgroundColor: colors.accentSurface }]}>
          <Text style={[styles.devInfoText, { color: colors.accent }]}>
            🔧 AsyncStorage aktiv (Expo Go kompatibel)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  screenTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.lg,
  },

  profileCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  profileEmail: { fontSize: FontSize.sm, marginBottom: 4 },
  roleBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  section: { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconText: { fontSize: 18 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  rowSubtitle: { fontSize: FontSize.sm, marginTop: 2 },
  rowArrow: { fontSize: 22 },

  langRadio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langRadioDot: { width: 11, height: 11, borderRadius: Radius.full },

  devInfo: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  devInfoText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
});
