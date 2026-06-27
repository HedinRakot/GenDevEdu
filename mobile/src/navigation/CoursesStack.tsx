import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CoursesScreen } from '@/screens/CoursesScreen';
import { CourseDetailScreen } from '@/screens/CourseDetailScreen';
import { LessonScreen } from '@/screens/LessonScreen';
import { ChapterQuizScreen } from '@/screens/ChapterQuizScreen';
import { GlossaryScreen } from '@/screens/GlossaryScreen';
import { useTheme } from '@/context/ThemeContext';
import { FontWeight } from '@/config/theme';

export type CoursesStackParamList = {
  CoursesList: undefined;
  CourseDetail: { courseId: string };
  Lesson: { courseId: string; lessonId: string; chapterId: string };
  ChapterQuiz: { courseId: string; chapterId: string; chapterName: string };
  Glossary: undefined;
};

const Stack = createNativeStackNavigator<CoursesStackParamList>();

export function CoursesStack() {
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
        name="CoursesList"
        component={CoursesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: '' }} />
      <Stack.Screen name="ChapterQuiz" component={ChapterQuizScreen} options={{ title: '' }} />
      <Stack.Screen name="Glossary" component={GlossaryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
