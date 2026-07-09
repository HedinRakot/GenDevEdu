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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAddChapter } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AddChapter'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'AddChapter'>;

export function AddChapterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { courseId } = route.params;

  const { mutate: add, isPending } = useAddChapter(courseId);

  const [name, setName] = useState('');
  const [titelDe, setTitelDe] = useState('');
  const [titelEn, setTitelEn] = useState('');

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name erforderlich');
      return;
    }
    add(
      {
        name: name.trim(),
        titelItems: [
          { text: titelDe.trim() || name.trim(), language: 1 },
          { text: titelEn.trim() || name.trim(), language: 2 },
        ],
        // Keine SortOrder mehr: Backend hängt ans Ende an; sortiert wird
        // im Kurs-Editor per ▲/▼ (Reorder-Endpoint).
        show: true,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: () => Alert.alert('Fehler', 'Kapitel konnte nicht erstellt werden.'),
      },
    );
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Neues Kapitel</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Interner Name *</Text>
          <TextInput style={inputStyle} value={name} onChangeText={setName}
            placeholder="z.B. introduction" placeholderTextColor={colors.textTertiary}
            autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Deutsch)</Text>
          <TextInput style={inputStyle} value={titelDe} onChangeText={setTitelDe}
            placeholder="z.B. Einführung" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Englisch)</Text>
          <TextInput style={inputStyle} value={titelEn} onChangeText={setTitelEn}
            placeholder="e.g. Introduction" placeholderTextColor={colors.textTertiary} />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={onSave}
            disabled={isPending}
          >
            <Text style={styles.saveButtonText}>
              {isPending ? 'Wird gespeichert…' : 'Kapitel erstellen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Abbrechen</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  form: { padding: Spacing.lg, gap: Spacing.sm },
  heading: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: Spacing.md },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md },
  saveButton: { marginTop: Spacing.xl, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  cancelButton: { marginTop: Spacing.sm, alignItems: 'center', padding: Spacing.sm },
  cancelText: { fontSize: FontSize.md },
});
