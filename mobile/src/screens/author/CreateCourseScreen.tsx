import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCreateCourse } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'CreateCourse'>;

export function CreateCourseScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { mutate: create, isPending } = useCreateCourse();

  const [name, setName] = useState('');
  const [titelDe, setTitelDe] = useState('');
  const [titelEn, setTitelEn] = useState('');

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name erforderlich', 'Bitte gib einen internen Namen ein.');
      return;
    }
    create(
      {
        name: name.trim(),
        titelItems: [
          { text: titelDe.trim() || name.trim(), language: 1 },
          { text: titelEn.trim() || name.trim(), language: 2 },
        ],
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.cancel, { color: colors.primary }]}>Abbrechen</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Neuer Kurs</Text>
          <TouchableOpacity onPress={onSave} disabled={isPending}>
            <Text style={[styles.save, { color: isPending ? colors.textTertiary : colors.primary }]}>
              {isPending ? 'Wird erstellt…' : 'Erstellen'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Interner Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="z.B. csharp-basics"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Deutsch)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={titelDe}
            onChangeText={setTitelDe}
            placeholder="z.B. C# Grundlagen"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Englisch)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={titelEn}
            onChangeText={setTitelEn}
            placeholder="e.g. C# Basics"
            placeholderTextColor={colors.textTertiary}
          />
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
  cancel: { fontSize: FontSize.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  save: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  form: { padding: Spacing.lg, gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
  },
});
