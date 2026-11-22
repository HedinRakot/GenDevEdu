import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { confirmDialog } from '@/utils/confirm';
import { getJson, setJson, STORAGE_KEYS } from '@/store/storage';
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

/** Sidebar-Breite auf Desktop/Web (ausgeklappt / eingeklappt). */
export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

/**
 * Desktop-/Web-Seitennavigation. Wird als `tabBar` des Bottom-Tab-Navigators auf breiten
 * Layouts gerendert und teilt sich dessen Routen-Register (state/navigation) – so bleiben
 * Deep-Links und web-only Verwaltungs-Screens synchron.
 */
export function Sidebar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  // Einklapp-Zustand, persistiert (überlebt Reload). Start expanded; nach Rehydrierung ggf. collapsed.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    getJson<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED).then((v) => {
      if (v != null) setCollapsed(v);
    });
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      void setJson(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
      return next;
    });

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
        collapsed={collapsed}
        onPress={() => onPress(route.name, route.key, isFocused)}
      />
    );
  };

  return (
    <View
      style={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        backgroundColor: colors.tabBackground,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingHorizontal: collapsed ? Spacing.xs : Spacing.md,
        paddingVertical: Spacing.lg,
      }}
    >
      {/* Logo / Wortmarke + Einklapp-Toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: Spacing.sm + 4,
          paddingHorizontal: collapsed ? 0 : Spacing.sm,
          paddingBottom: Spacing.lg,
        }}
      >
        {!collapsed && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 4 }}>
            <Icon name="logo" size={26} color={colors.accent} strokeWidth={1.75} />
            <Typography variant="h3">EduCode</Typography>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(collapsed ? 'navigation.expandSidebar' : 'navigation.collapseSidebar', collapsed ? 'Menü ausklappen' : 'Menü einklappen')}
          onPress={toggleCollapsed}
          style={({ pressed }) => ({ padding: Spacing.xs, opacity: pressed ? 0.7 : 1 })}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Sektion Lernen */}
      {!collapsed && (
        <Typography
          variant="caption"
          color="tertiary"
          style={{ letterSpacing: 1.4, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs }}
        >
          {t('navigation.sectionLearn', 'LERNEN').toUpperCase()}
        </Typography>
      )}
      <View style={{ gap: 2 }}>{learn.map(renderItem)}</View>

      {/* Sektion Verwaltung (nur wenn Rollen-Screens registriert sind) */}
      {manage.length > 0 && (
        <>
          {!collapsed && (
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
          )}
          <View style={{ gap: 2, marginTop: collapsed ? Spacing.sm : 0 }}>{manage.map(renderItem)}</View>
        </>
      )}

      <View style={{ flex: 1 }} />

      {/* Nutzerblock */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: Spacing.sm + 2,
          paddingTop: Spacing.md,
          paddingHorizontal: collapsed ? 0 : Spacing.sm,
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
        {!collapsed && (
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="label" numberOfLines={1}>
              {user?.name || user?.email || 'Gast'}
            </Typography>
            <Typography variant="caption" color="tertiary" numberOfLines={1}>
              {t(`roles.${user?.role ?? 'student'}`, 'Lernende')}
            </Typography>
          </View>
        )}
      </View>

      {/* Abmelden */}
      <View style={{ marginTop: Spacing.xs }}>
        <SidebarItem icon="logout" label={t('auth.logout', 'Abmelden')} collapsed={collapsed} onPress={handleLogout} />
      </View>
    </View>
  );
}
