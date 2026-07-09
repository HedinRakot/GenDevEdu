import React from 'react';
import { BottomTabBar, createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SnippetsScreen } from '@/screens/SnippetsScreen';
import { CoursesStack } from './CoursesStack';
import { AuthorStack } from './AuthorStack';
import { AttendanceStack } from './AttendanceStack';
import { LearnersStack } from './LearnersStack';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { isManagementPlatform } from '@/utils/platform';
import { Radius, Shadow, Spacing } from '@/config/theme';
import { Icon, type IconName, Typography } from '@/components/common';
import { Sidebar } from './Sidebar';

export type AppTabsParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Chat: undefined;
  Snippets: undefined;
  Settings: undefined;
  Author: undefined;
  Admin: undefined;
  Attendance: undefined;
  Learners: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

/** Inhaltshöhe der Tab-Bar ohne unteren Safe-Area-Inset. */
const TAB_BAR_HEIGHT = 64;

interface TabIconProps {
  icon: IconName;
  focused: boolean;
  label: string;
}

function TabIcon({ icon, focused, label }: TabIconProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tabIconContainer,
        focused && { backgroundColor: colors.primarySurface },
      ]}
    >
      <Icon
        name={icon}
        size={22}
        color={focused ? colors.tabActive : colors.tabInactive}
        strokeWidth={focused ? 2 : 1.75}
      />
      <Typography
        variant="caption"
        numberOfLines={1}
        style={{ color: focused ? colors.tabActive : colors.tabInactive, marginTop: 2 }}
      >
        {label}
      </Typography>
    </View>
  );
}

export function AppTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsive();
  // Verwaltung ist web-only: auf iOS/Android werden die Bereiche gar nicht
  // erst registriert (siehe utils/platform.ts).
  const isAuthor =
    isManagementPlatform && (user?.role === 'instructor' || user?.role === 'admin');
  const isAdmin = isManagementPlatform && user?.role === 'admin';

  // Ein Routen-Register für beide Modi: schmal → Bottom-Tab-Bar, breit → Sidebar.
  const renderTabBar = (props: BottomTabBarProps) =>
    isWide ? <Sidebar {...props} /> : <BottomTabBar {...props} />;

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isWide ? 'left' : 'bottom',
        // Höhe + unteres Padding um den Safe-Area-Inset erweitern (Home-Indicator),
        // sonst rutschen die Icons auf dem Smartphone nach oben.
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBackground,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="dashboard" focused={focused} label={t('navigation.dashboard')} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="courses" focused={focused} label={t('navigation.courses')} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="chat" focused={focused} label={t('navigation.chat')} />
          ),
        }}
      />
      {/* Snippets: nicht mehr in der Bottom-Bar (erreichbar über Dashboard + Einstellungen),
          aber als Screen registriert, damit navigation.navigate('Snippets') weiter funktioniert. */}
      <Tab.Screen
        name="Snippets"
        component={SnippetsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
      {/* Rollen-Bereiche: nicht in der Bottom-Bar (würde sie überfüllen), sondern
          über die Einstellungen erreichbar — daher als Screen registriert, aber
          ohne eigenen Tab-Button. */}
      {isAuthor && (
        <Tab.Screen
          name="Author"
          component={AuthorStack}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      )}
      {isAuthor && (
        <Tab.Screen
          name="Attendance"
          component={AttendanceStack}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      )}
      {isAuthor && (
        <Tab.Screen
          name="Learners"
          component={LearnersStack}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminUsersScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButtonTestID: 'tab-settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="settings" focused={focused} label={t('navigation.settings')} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: TAB_BAR_HEIGHT,
    paddingBottom: 0,
    ...Shadow.md,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 60,
    gap: 2,
  },
});
