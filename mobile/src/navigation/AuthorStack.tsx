import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthorCoursesScreen } from '@/screens/author/AuthorCoursesScreen';
import { CreateCourseScreen } from '@/screens/author/CreateCourseScreen';
import { CourseEditorScreen } from '@/screens/author/CourseEditorScreen';
import { AddChapterScreen } from '@/screens/author/AddChapterScreen';
import { AddChapterContentScreen } from '@/screens/author/AddChapterContentScreen';
import { AddQuestionListScreen } from '@/screens/author/AddQuestionListScreen';
import { ChapterQuizEditorScreen } from '@/screens/author/ChapterQuizEditorScreen';
import { useTheme } from '@/context/ThemeContext';
import { FontWeight } from '@/config/theme';

export type AuthorStackParamList = {
  AuthorCourses: undefined;
  CreateCourse: undefined;
  CourseEditor: { courseId: string; courseName: string };
  AddChapter: { courseId: string };
  AddChapterContent: {
    chapterId: string;
    courseId: string;
    chapterName: string;
    /** Gesetzt = Bearbeiten-Modus für diesen Inhalt (statt neu anlegen). */
    editContentId?: string;
  };
  AddQuestionList: {
    chapterContentId: string;
    courseId: string;
    /** Gesetzt = bestehende Fragenliste bearbeiten (statt neu anlegen). */
    questionListId?: string;
  };
  ChapterQuizEditor: { chapterId: string; courseId: string; chapterName: string };
};

const Stack = createNativeStackNavigator<AuthorStackParamList>();

export function AuthorStack() {
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
        name="AuthorCourses"
        component={AuthorCoursesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateCourse"
        component={CreateCourseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseEditor"
        component={CourseEditorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddChapter"
        component={AddChapterScreen}
        options={{ title: 'Kapitel hinzufügen' }}
      />
      <Stack.Screen
        name="AddChapterContent"
        component={AddChapterContentScreen}
        options={{ title: 'Inhalt hinzufügen' }}
      />
      <Stack.Screen
        name="AddQuestionList"
        component={AddQuestionListScreen}
        options={{ title: 'Fragen erstellen' }}
      />
      <Stack.Screen
        name="ChapterQuizEditor"
        component={ChapterQuizEditorScreen}
        options={{ title: 'Abschlussquiz' }}
      />
    </Stack.Navigator>
  );
}
