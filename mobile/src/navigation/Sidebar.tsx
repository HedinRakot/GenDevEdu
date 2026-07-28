import React from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { confirmDialog } from '@/utils/confirm';
import { Spacing } from '@/config/theme';
import { Icon, type IconName, SidebarItem, Typography } from '@/components/common';

/** Route-Name → Icon, Sektion und i18n-Label-Key. Steuert Reihenfolge & Gruppierung. */
const NAV_CONFIG: Record<
  string,
  { icon: IconName; section: 'learn' | 'manage'; labelKey: string; fallback: string }
> = {
  Dashboard: { icon: 'dashboard', section: 'learn', labelKey: 'navigation.dashboard', fallback: 'Dashboard' },
  Courses: { icon: 'courses', section: 'learn', labelKey: 'navigation.courses', fallback: 'Kurse' },
  Chat: { icon: 'chat', section: 'learn', labelKey: 'navigation.chat', fallback: 'KI-Tutor' },
  Snippets: { icon: 'snippets', section: 'learn', labelKey: 'navigation.snippets', fallback: 'Snippets' },
  Settings: { icon: 'settings', section: 'learn', labelKey: 'navigation.settings', fallback: 'Einstellungen' },
  Author: { icon: 'edit', section: 'manage', labelKey: 'navigation.author', fallback: 'Autoren-Bereich' },
  Attendance: { icon: 'clock', section: 'manage', labelKey: 'navigation.attendance', fallback: 'Anwesenheit' },
  Learners: { icon: 'users', section: 'manage', labelKey: 'navigation.learners', fallback: 'Lernende' },
  Admin: { icon: 'users', section: 'manage', labelKey: 'navigation.admin', fallback: 'Verwaltung' },
};

/** Feste Sidebar-Breite auf Desktop/Web. */
export const SIDEBAR_WIDTH = 248;

/**
 * Desktop-/Web-Seitennavigation. Wird als `tabBar` des Bottom-Tab-Navigators auf breiten
 * Layouts gerendert und teilt sich dessen Routen-Register (state/navigation) – so bleiben
 * Deep-Links und web-only Verwaltungs-Screens synchron.
 */
export function Sidebar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () =>
    confirmDialog({
      title: t('auth.logoutConfirm'),
      confirmLabel: t('auth.logout'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: () => logout(),
    });

  const routes = state.routes
    .map((route, index) => ({ route, index, cfg: NAV_CONFIG[route.name] }))
    .filter((r) => r.cfg);

  const learn = routes.filter((r) => r.cfg!.section === 'learn');
  const manage = routes.filter((r) => r.cfg!.section === 'manage');

  const initials = (user?.name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const onPress = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderItem = ({ route, index }: (typeof routes)[number]) => {
    const cfg = NAV_CONFIG[route.name];
    const isFocused = state.index === index;
    return (
      <SidebarItem
        key={route.key}
        icon={cfg.icon}
        label={t(cfg.labelKey, cfg.fallback)}
        active={isFocused}
        onPress={() => onPress(route.name, route.key, isFocused)}
      />
    );
  };

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        backgroundColor: colors.tabBackground,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
      }}
    >
      {/* Logo / Wortmarke */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm + 4,
          paddingHorizontal: Spacing.sm,
          paddingBottom: Spacing.lg,
        }}
      >
        <Icon name="logo" size={26} color={colors.accent} strokeWidth={1.75} />
        <Typography variant="h3">EduCode</Typography>
      </View>

      {/* Sektion Lernen */}
      <Typography
        variant="caption"
        color="tertiary"
        style={{ letterSpacing: 1.4, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs }}
      >
        {t('navigation.sectionLearn', 'LERNEN').toUpperCase()}
      </Typography>
      <View style={{ gap: 2 }}>{learn.map(renderItem)}</View>

      {/* Sektion Verwaltung (nur wenn Rollen-Screens registriert sind) */}
      {manage.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="tertiary"
            style={{
              letterSpacing: 1.4,
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.xs,
            }}
          >
            {t('navigation.sectionManage', 'VERWALTUNG').toUpperCase()}
          </Typography>
          <View style={{ gap: 2 }}>{manage.map(renderItem)}</View>
        </>
      )}

      <View style={{ flex: 1 }} />

      {/* Nutzerblock */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm + 2,
          paddingTop: Spacing.md,
          paddingHorizontal: Spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primarySurface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="label" color="accent">
            {initials || '?'}
          </Typography>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="label" numberOfLines={1}>
            {user?.name || user?.email || 'Gast'}
          </Typography>
          <Typography variant="caption" color="tertiary" numberOfLines={1}>
            {t(`roles.${user?.role ?? 'student'}`, 'Lernende')}
          </Typography>
        </View>
      </View>

      {/* Abmelden */}
      <View style={{ marginTop: Spacing.xs }}>
        <SidebarItem icon="logout" label={t('auth.logout', 'Abmelden')} onPress={handleLogout} />
      </View>
    </View>
  );
}
