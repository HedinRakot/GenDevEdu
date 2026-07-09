import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
import { Button, Input, Typography } from '@/components/common';
import { FontFamily, FontSize, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'DailyChallengeEditor'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'DailyChallengeEditor'>;

const DIFFICULTIES = [
  { label: 'Leicht', value: 'easy' },
  { label: 'Mittel', value: 'medium' },
  { label: 'Schwer', value: 'hard' },
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

  const fieldGap = { marginTop: Spacing.md };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Typography variant="h2" style={{ marginBottom: Spacing.md }}>
            {isEdit ? 'Challenge bearbeiten' : 'Neue Challenge'}
          </Typography>

          {!isEdit && (
            <Input
              label="Slug (optional, z.B. cs-arrays)"
              value={slug}
              onChangeText={setSlug}
              placeholder="wird sonst generiert"
              autoCapitalize="none"
            />
          )}

          <Input
            containerStyle={!isEdit ? fieldGap : undefined}
            label="Titel (Deutsch) *"
            value={titleDe}
            onChangeText={setTitleDe}
            placeholder="z.B. Arrays durchlaufen"
          />
          <Input
            containerStyle={fieldGap}
            label="Titel (Englisch)"
            value={titleEn}
            onChangeText={setTitleEn}
            placeholder="e.g. Iterate arrays"
          />

          <Input
            containerStyle={fieldGap}
            label="Beschreibung (Deutsch) *"
            value={descDe}
            onChangeText={setDescDe}
            placeholder="Aufgabenstellung…"
            multiline
            textAlignVertical="top"
            style={styles.multiline}
          />
          <Input
            containerStyle={fieldGap}
            label="Beschreibung (Englisch)"
            value={descEn}
            onChangeText={setDescEn}
            placeholder="Task description…"
            multiline
            textAlignVertical="top"
            style={styles.multiline}
          />

          <Input
            containerStyle={fieldGap}
            label="Beispiel-Code (optional)"
            value={snippet}
            onChangeText={setSnippet}
            placeholder="Console.WriteLine(…);"
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[styles.multiline, styles.code]}
          />

          <Typography variant="label" color="secondary" style={fieldGap}>
            Schwierigkeit
          </Typography>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <Button
                key={d.value}
                title={d.label}
                size="sm"
                variant={difficulty === d.value ? 'primary' : 'secondary'}
                onPress={() => setDifficulty(d.value)}
              />
            ))}
          </View>

          <Input
            containerStyle={fieldGap}
            label="Kategorie"
            value={category}
            onChangeText={setCategory}
            placeholder="z.B. loops, linq, classes"
            autoCapitalize="none"
          />

          <Input
            containerStyle={fieldGap}
            label="Geschätzte Minuten"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Typography variant="label" color="secondary" style={styles.switchLabel}>
              Aktiv (nimmt an der Tagesauswahl teil)
            </Typography>
            <Switch value={active} onValueChange={setActive} />
          </View>

          <Button
            title={isPending ? 'Wird gespeichert…' : isEdit ? 'Änderungen speichern' : 'Challenge erstellen'}
            onPress={onSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
            iconRight="check"
            style={{ marginTop: Spacing.xl }}
          />

          <Button
            title="Abbrechen"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ alignSelf: 'center', marginTop: Spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  form: { padding: Spacing.lg },
  multiline: { minHeight: 90 },
  code: { fontFamily: FontFamily.mono, fontSize: FontSize.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  switchLabel: { flexShrink: 1 },
});
