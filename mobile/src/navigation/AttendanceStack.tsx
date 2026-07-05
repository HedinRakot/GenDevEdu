import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AttendanceOverviewScreen } from '@/screens/admin/AttendanceOverviewScreen';
import { AttendanceLearnerDetailScreen } from '@/screens/admin/AttendanceLearnerDetailScreen';
import { TrainingPeriodsScreen } from '@/screens/admin/TrainingPeriodsScreen';
import { AttendanceExportScreen } from '@/screens/admin/AttendanceExportScreen';
import { useTheme } from '@/context/ThemeContext';
import { FontWeight } from '@/config/theme';

export type AttendanceStackParamList = {
  AttendanceOverview: undefined;
  AttendanceLearnerDetail: { userId: string; displayName: string };
  TrainingPeriods: undefined;
  AttendanceExport: undefined;
};

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

/** F14: Anwesenheits-Bereich (Lehrer: Übersicht/Detail; Admin: Zeiträume/Export). */
export function AttendanceStack() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: FontWeight.semibold,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="AttendanceOverview"
        component={AttendanceOverviewScreen}
        options={{ title: t('attendance.title') }}
      />
      <Stack.Screen
        name="AttendanceLearnerDetail"
        component={AttendanceLearnerDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="TrainingPeriods"
        component={TrainingPeriodsScreen}
        options={{ title: t('attendance.periods.title') }}
      />
      <Stack.Screen
        name="AttendanceExport"
        component={AttendanceExportScreen}
        options={{ title: t('attendance.export.title') }}
      />
    </Stack.Navigator>
  );
}
