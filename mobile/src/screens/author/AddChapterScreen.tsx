import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAddChapter } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { Spacing } from '@/config/theme';
import { Button, Input, Typography } from '@/components/common';

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
        // im Kurs-Editor per Pfeil (Reorder-Endpoint).
        show: true,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: () => Alert.alert('Fehler', 'Kapitel konnte nicht erstellt werden.'),
      },
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Typography variant="h2" style={{ marginBottom: Spacing.sm }}>
            Neues Kapitel
          </Typography>

          <Input
            label="Interner Name *"
            value={name}
            onChangeText={setName}
            placeholder="z.B. introduction"
            autoCapitalize="none"
          />

          <Input
            label="Titel (Deutsch)"
            value={titelDe}
            onChangeText={setTitelDe}
            placeholder="z.B. Einführung"
          />

          <Input
            label="Titel (Englisch)"
            value={titelEn}
            onChangeText={setTitelEn}
            placeholder="e.g. Introduction"
          />

          <Button
            title="Kapitel erstellen"
            onPress={onSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
            iconRight="arrow-right"
            style={{ marginTop: Spacing.lg }}
          />

          <Button
            title="Abbrechen"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ alignSelf: 'center', marginTop: Spacing.xs }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  form: { padding: Spacing.lg, gap: Spacing.md },
});
