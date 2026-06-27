import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SnippetsScreen } from '@/screens/SnippetsScreen';
import { CoursesStack } from './CoursesStack';
import { AuthorStack } from './AuthorStack';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

export type AppTabsParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Chat: undefined;
  Snippets: undefined;
  Settings: undefined;
  Author: undefined;
  Admin: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

interface TabIconProps {
  emoji: string;
  focused: boolean;
  label: string;
}

function TabIcon({ emoji, focused, label }: TabIconProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tabIconContainer,
        focused && { backgroundColor: colors.primarySurface },
      ]}
    >
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.tabActive : colors.tabInactive },
          focused && styles.tabLabelFocused,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function AppTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAuthor = user?.role === 'instructor' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.tabBackground }],
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} label={t('navigation.dashboard')} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" focused={focused} label={t('navigation.courses')} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" focused={focused} label={t('navigation.chat')} />
          ),
        }}
      />
      <Tab.Screen
        name="Snippets"
        component={SnippetsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📌" focused={focused} label={t('navigation.snippets')} />
          ),
        }}
      />
      {isAuthor && (
        <Tab.Screen
          name="Author"
          component={AuthorStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="✏️" focused={focused} label={t('navigation.author')} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminUsersScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🛡️" focused={focused} label={t('navigation.admin')} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} label={t('navigation.settings')} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: 72,
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
  tabEmoji: { fontSize: 22 },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  tabLabelFocused: { fontWeight: FontWeight.semibold },
});
