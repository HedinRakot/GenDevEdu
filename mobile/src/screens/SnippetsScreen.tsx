import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSnippets } from '@/hooks/useSnippets';
import { useTheme } from '@/context/ThemeContext';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';
import type { Snippet } from '@/types/snippet';

const SOURCE_ICON: Record<Snippet['source'], string> = {
  chat: '🤖',
  lesson: '📚',
  manual: '✍️',
};

export function SnippetsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { snippets, isLoading, remove } = useSnippets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [query, snippets]);

  const confirmDelete = (snippet: Snippet) => {
    Alert.alert(t('snippets.delete'), t('snippets.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => remove(snippet.id) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('snippets.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('snippets.subtitle')}
        </Text>
      </View>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={query}
          onChangeText={setQuery}
          placeholder={t('snippets.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📌</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('snippets.empty')}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardSource, { color: colors.textTertiary }]}>
                {SOURCE_ICON[item.source]} {t(`snippets.source.${item.source}`)}
              </Text>
              <TouchableOpacity onPress={() => confirmDelete(item)}>
                <Text style={[styles.cardDelete, { color: colors.error }]}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <View style={styles.cardBody}>
              <MarkdownRenderer content={item.content} />
            </View>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[styles.tag, { backgroundColor: colors.primarySurface }]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.lg, paddingBottom: 0 },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  subtitle: { fontSize: FontSize.md, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, textAlign: 'center' },

  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardSource: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
  cardDelete: { fontSize: 16 },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 4 },
  cardBody: { marginTop: Spacing.xs },
  tagRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap' },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
