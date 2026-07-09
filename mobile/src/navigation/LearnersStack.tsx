import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LearnersOverviewScreen } from '@/screens/admin/LearnersOverviewScreen';
import { LearnerStatsScreen } from '@/screens/admin/LearnerStatsScreen';
import { useTheme } from '@/context/ThemeContext';
import { FontWeight } from '@/config/theme';

export type LearnersStackParamList = {
  LearnersOverview: undefined;
  LearnerStats: { userId: string; displayName: string };
};

const Stack = createNativeStackNavigator<LearnersStackParamList>();

/** Teilnehmer-Dashboard (Übersicht + Detail) für Autoren/Admins — web-only. */
export function LearnersStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeight.semibold, color: colors.textPrimary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="LearnersOverview"
        component={LearnersOverviewScreen}
        options={{ title: 'Teilnehmer' }}
      />
      <Stack.Screen
        name="LearnerStats"
        component={LearnerStatsScreen}
        options={({ route }) => ({ title: route.params.displayName })}
      />
    </Stack.Navigator>
  );
}
