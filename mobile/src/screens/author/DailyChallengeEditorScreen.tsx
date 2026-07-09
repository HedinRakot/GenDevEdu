import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAdminChallenges, useSaveChallenge } from '@/hooks/useDailyChallengeAdmin';
import { useTheme } from '@/context/ThemeContext';
import { Language } from '@/types/course';
import type { TextItem } from '@/types/course';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'DailyChallengeEditor'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'DailyChallengeEditor'>;

const DIFFICULTIES = [
  { label: '🟢 Leicht', value: 'easy' },
  { label: '🟡 Mittel', value: 'medium' },
  { label: '🔴 Schwer', value: 'hard' },
];

function textFor(items: TextItem[] | undefined, lang: Language): string {
  return items?.find((i) => i.language === lang)?.text ?? '';
}

export function DailyChallengeEditorScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { challengeId } = route.params;
  const isEdit = !!challengeId;

  const { data: challenges } = useAdminChallenges();
  const { mutate: save, isPending } = useSaveChallenge();
  const editing = isEdit ? challenges?.find((c) => c.id === challengeId) : undefined;

  const [slug, setSlug] = useState('');
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descDe, setDescDe] = useState('');
  const [descEn, setDescEn] = useState('');
  const [snippet, setSnippet] = useState('');
  const [minutes, setMinutes] = useState('5');
  const [difficulty, setDifficulty] = useState('easy');
  const [category, setCategory] = useState('general');
  const [active, setActive] = useState(true);

  // Bearbeiten-Modus: einmalig vorbefüllen, sobald die Liste geladen ist.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !editing) return;
    prefilled.current = true;
    setTitleDe(textFor(editing.title?.items, Language.German));
    setTitleEn(textFor(editing.title?.items, Language.English));
    setDescDe(textFor(editing.description?.items, Language.German));
    setDescEn(textFor(editing.description?.items, Language.English));
    setSnippet(editing.exampleSnippet ?? '');
    setMinutes(String(editing.estimatedMinutes));
    setDifficulty(editing.difficulty);
    setCategory(editing.category);
    setActive(editing.active);
  }, [isEdit, editing]);

  const onSave = () => {
    if (!titleDe.trim() && !titleEn.trim()) {
      Alert.alert('Titel erforderlich');
      return;
    }
    if (!descDe.trim() && !descEn.trim()) {
      Alert.alert('Beschreibung erforderlich');
      return;
    }
    save(
      {
        id: challengeId,
        req: {
          id: isEdit ? undefined : slug.trim() || undefined,
          titleItems: [
            { text: titleDe.trim() || titleEn.trim(), language: 1 },
            { text: titleEn.trim() || titleDe.trim(), language: 2 },
          ],
          descriptionItems: [
            { text: descDe.trim() || descEn.trim(), language: 1 },
            { text: descEn.trim() || descDe.trim(), language: 2 },
          ],
          exampleSnippet: snippet.trim() || undefined,
          snippetLang: 'csharp',
          estimatedMinutes: parseInt(minutes, 10) || 5,
          difficulty,
          category: category.trim() || 'general',
          active,
        },
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: () => Alert.alert('Fehler', 'Challenge konnte nicht gespeichert werden.'),
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
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {isEdit ? 'Challenge bearbeiten' : 'Neue Challenge'}
          </Text>

          {!isEdit && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Slug (optional, z.B. cs-arrays)
              </Text>
              <TextInput style={inputStyle} value={slug} onChangeText={setSlug}
                placeholder="wird sonst generiert" placeholderTextColor={colors.textTertiary}
                autoCapitalize="none" />
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Deutsch) *</Text>
          <TextInput style={inputStyle} value={titleDe} onChangeText={setTitleDe}
            placeholder="z.B. Arrays durchlaufen" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Englisch)</Text>
          <TextInput style={inputStyle} value={titleEn} onChangeText={setTitleEn}
            placeholder="e.g. Iterate arrays" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Beschreibung (Deutsch) *</Text>
          <TextInput style={[inputStyle, styles.multiline]} value={descDe} onChangeText={setDescDe}
            placeholder="Aufgabenstellung…" placeholderTextColor={colors.textTertiary}
            multiline textAlignVertical="top" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Beschreibung (Englisch)</Text>
          <TextInput style={[inputStyle, styles.multiline]} value={descEn} onChangeText={setDescEn}
            placeholder="Task description…" placeholderTextColor={colors.textTertiary}
            multiline textAlignVertical="top" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Beispiel-Code (optional)</Text>
          <TextInput style={[inputStyle, styles.multiline, styles.code]} value={snippet}
            onChangeText={setSnippet} placeholder="Console.WriteLine(…);"
            placeholderTextColor={colors.textTertiary} multiline textAlignVertical="top"
            autoCapitalize="none" autoCorrect={false} spellCheck={false} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Schwierigkeit</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: difficulty === d.value ? colors.primary : colors.surface,
                    borderColor: difficulty === d.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDifficulty(d.value)}
              >
                <Text
                  style={{
                    color: difficulty === d.value ? 'white' : colors.textPrimary,
                    fontWeight: FontWeight.medium,
                  }}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Kategorie</Text>
          <TextInput style={inputStyle} value={category} onChangeText={setCategory}
            placeholder="z.B. loops, linq, classes" placeholderTextColor={colors.textTertiary}
            autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Geschätzte Minuten</Text>
          <TextInput style={inputStyle} value={minutes} onChangeText={setMinutes}
            keyboardType="numeric" placeholderTextColor={colors.textTertiary} />

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0 }]}>
              Aktiv (nimmt an der Tagesauswahl teil)
            </Text>
            <Switch value={active} onValueChange={setActive} />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={onSave}
            disabled={isPending}
          >
            <Text style={styles.saveButtonText}>
              {isPending ? 'Wird gespeichert…' : isEdit ? 'Änderungen speichern' : 'Challenge erstellen'}
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
  multiline: { minHeight: 90 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: FontSize.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  saveButton: { marginTop: Spacing.xl, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  cancelButton: { marginTop: Spacing.sm, alignItems: 'center', padding: Spacing.sm },
  cancelText: { fontSize: FontSize.md },
});
