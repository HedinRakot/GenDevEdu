import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { saveLanguage } from '@/store/storage';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { isManagementPlatform } from '@/utils/platform';
import {
  cancelStreakReminder,
  isStreakReminderEnabled,
  scheduleDailyStreakReminder,
} from '@/services/notifications';
import { Radius, Shadow, Spacing } from '@/config/theme';
import { Badge, Card, Icon, Typography, type IconName } from '@/components/common';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Typography variant="caption" color="tertiary" style={styles.sectionLabel}>
        {title.toUpperCase()}
      </Typography>
      <Card padded={false} style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );
}

interface SettingsRowProps {
  icon: IconName;
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
  const tint = variant === 'danger' ? colors.error : colors.textSecondary;
  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
      ]}
      onPress={onPress}
      disabled={!onPress && !trailing}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: variant === 'danger' ? colors.errorSurface : colors.surfaceElevated },
        ]}
      >
        <Icon name={icon} size={18} color={tint} />
      </View>
      <View style={styles.rowContent}>
        <Typography variant="body" color={variant === 'danger' ? colors.error : 'primary'}>
          {label}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            {subtitle}
          </Typography>
        )}
      </View>
      {trailing ??
        (onPress && <Icon name="chevron-right" size={18} color={colors.textTertiary} />)}
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

  const roleLabel =
    user?.role === 'instructor' ? 'Author' : user?.role === 'admin' ? 'Admin' : 'Student';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Typography variant="h1" style={{ marginBottom: Spacing.lg }}>
          {t('settings.title')}
        </Typography>

        {user && (
          <Card style={styles.profileCard}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
              <Typography variant="h2" color="inverted">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </Typography>
            </View>
            <View style={styles.profileMeta}>
              <Typography variant="h3">{user.name || user.email}</Typography>
              <Typography variant="bodySm" color="secondary" style={{ marginBottom: Spacing.xs }}>
                {user.email}
              </Typography>
              <Badge label={roleLabel} tone="default" />
            </View>
          </Card>
        )}

        {/* Sprache */}
        <SettingsSection title={t('settings.language.title')}>
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <SettingsRow
              key={lang.code}
              icon="message"
              label={lang.nativeName}
              subtitle={lang.code.toUpperCase()}
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
            icon="circle"
            label={t('settings.appearance.darkMode')}
            subtitle={t('settings.appearance.darkModeSubtitle')}
            trailing={
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textInverted}
                disabled={mode === 'system'}
              />
            }
          />
          <SettingsRow
            icon="settings"
            label={t('settings.appearance.followSystem')}
            subtitle={t('settings.appearance.followSystemSubtitle')}
            isLast
            trailing={
              <Switch
                value={mode === 'system'}
                onValueChange={toggleSystemTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textInverted}
              />
            }
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title={t('settings.notifications.title')}>
          <SettingsRow
            icon="streak"
            label={t('settings.notifications.streakReminder')}
            subtitle={t('settings.notifications.streakReminderSubtitle')}
            isLast
            trailing={
              <Switch
                value={notificationsOn}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textInverted}
              />
            }
          />
        </SettingsSection>

        {/* Lerntools */}
        <SettingsSection title={t('settings.tools.title')}>
          <SettingsRow
            icon="courses"
            label={t('glossary.title')}
            subtitle={t('glossary.subtitle')}
            onPress={() => navigation.navigate('Courses', { screen: 'Glossary' })}
          />
          <SettingsRow
            icon="snippets"
            label={t('snippets.title')}
            subtitle={t('snippets.subtitle')}
            onPress={() => navigation.navigate('Snippets')}
            isLast
          />
        </SettingsSection>

        {/* Verwaltung (rollenabhängig, nur im Web — siehe utils/platform.ts) */}
        {(isAuthor || isAdmin) && isManagementPlatform && (
          <SettingsSection title={t('settings.management.title')}>
            {isAuthor && (
              <SettingsRow
                icon="edit"
                label={t('settings.management.author')}
                subtitle={t('settings.management.authorSubtitle')}
                onPress={() => navigation.navigate('Author')}
              />
            )}
            {isAuthor && (
              <SettingsRow
                icon="clock"
                label={t('settings.management.attendance')}
                subtitle={t('settings.management.attendanceSubtitle')}
                onPress={() => navigation.navigate('Attendance')}
              />
            )}
            {isAuthor && (
              <SettingsRow
                icon="users"
                label={t('settings.management.learners')}
                subtitle={t('settings.management.learnersSubtitle')}
                onPress={() => navigation.navigate('Learners')}
                isLast={!isAdmin}
              />
            )}
            {isAdmin && (
              <SettingsRow
                icon="lock"
                label={t('settings.management.admin')}
                subtitle={t('settings.management.adminSubtitle')}
                onPress={() => navigation.navigate('Admin')}
                isLast
              />
            )}
          </SettingsSection>
        )}
        {(isAuthor || isAdmin) && !isManagementPlatform && (
          <SettingsSection title={t('settings.management.title')}>
            <SettingsRow
              icon="dashboard"
              label={t('settings.management.webOnly')}
              subtitle={t('settings.management.webOnlySubtitle')}
              isLast
            />
          </SettingsSection>
        )}

        {/* Konto */}
        <SettingsSection title={t('settings.account.title')}>
          <SettingsRow
            icon="logout"
            label={t('settings.account.logoutButton')}
            onPress={handleLogout}
            isLast
            variant="danger"
          />
        </SettingsSection>

        {/* Über die App */}
        <SettingsSection title={t('settings.about.title')}>
          <SettingsRow
            icon="logo"
            label={t('settings.about.appName')}
            subtitle={t('settings.about.version', { version: '1.0.0' })}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: { flex: 1 },

  section: { marginBottom: Spacing.lg },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  sectionCard: { overflow: 'hidden', ...Shadow.sm },

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
  rowContent: { flex: 1 },

  langRadio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langRadioDot: { width: 11, height: 11, borderRadius: Radius.full },
});
