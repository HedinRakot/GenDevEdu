import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCreateCourse } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { Button, Input, Typography } from '@/components/common';
import { Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'CreateCourse'>;

export function CreateCourseScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { mutate: create, isPending } = useCreateCourse();

  const [name, setName] = useState('');
  const [titelDe, setTitelDe] = useState('');
  const [titelEn, setTitelEn] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [level, setLevel] = useState('');

  const LEVELS: { value: string; label: string }[] = [
    { value: 'Beginner', label: 'Anfänger' },
    { value: 'Intermediate', label: 'Fortgeschritten' },
    { value: 'Advanced', label: 'Experte' },
  ];

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name erforderlich', 'Bitte gib einen internen Namen ein.');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    create(
      {
        name: name.trim(),
        titelItems: [
          { text: titelDe.trim() || name.trim(), language: 1 },
          { text: titelEn.trim() || name.trim(), language: 2 },
        ],
        tags,
        level,
      },
      {
        onSuccess: (course) => {
          navigation.replace('CourseEditor', {
            courseId: course.elementId,
            courseName: titelDe.trim() || name.trim(),
          });
        },
        onError: () => Alert.alert('Fehler', 'Kurs konnte nicht erstellt werden.'),
      },
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Button title="Abbrechen" variant="ghost" size="sm" onPress={() => navigation.goBack()} />
          <Typography variant="h3">Neuer Kurs</Typography>
          <Button
            testID="create-course-submit"
            title={isPending ? 'Wird erstellt…' : 'Erstellen'}
            size="sm"
            loading={isPending}
            disabled={isPending}
            iconRight="check"
            onPress={onSave}
          />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Input
            testID="create-course-name"
            label="Interner Name *"
            value={name}
            onChangeText={setName}
            placeholder="z.B. csharp-basics"
            autoCapitalize="none"
          />

          <Input
            label="Titel (Deutsch)"
            value={titelDe}
            onChangeText={setTitelDe}
            placeholder="z.B. C# Grundlagen"
          />

          <Input
            label="Titel (Englisch)"
            value={titelEn}
            onChangeText={setTitelEn}
            placeholder="e.g. C# Basics"
          />

          <Input
            label="Tags (kommagetrennt)"
            value={tagsInput}
            onChangeText={setTagsInput}
            placeholder="z.B. csharp, grundlagen"
            autoCapitalize="none"
          />

          <View>
            <Typography variant="label" color="secondary" style={{ marginBottom: Spacing.xs }}>
              Level
            </Typography>
            <View style={styles.levelRow}>
              {LEVELS.map((lv) => {
                const active = level === lv.value;
                return (
                  <TouchableOpacity
                    key={lv.value}
                    onPress={() => setLevel((cur) => (cur === lv.value ? '' : lv.value))}
                    style={[
                      styles.levelChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      color={active ? 'inverted' : 'primary'}
                    >
                      {lv.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  form: { padding: Spacing.lg, gap: Spacing.md },
  levelRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  levelChip: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
});
