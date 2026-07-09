import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSnippets } from '@/hooks/useSnippets';
import { useTheme } from '@/context/ThemeContext';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { Badge, Card, Icon, Input, Typography, type IconName } from '@/components/common';
import { Spacing } from '@/config/theme';
import type { Snippet } from '@/types/snippet';

const SOURCE_ICON: Record<Snippet['source'], IconName> = {
  chat: 'chat',
  lesson: 'courses',
  manual: 'edit',
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
        <Typography variant="h1">{t('snippets.title')}</Typography>
        <Typography variant="body" color="secondary">
          {t('snippets.subtitle')}
        </Typography>
      </View>

      <Input
        leftIcon="search"
        containerStyle={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('snippets.searchPlaceholder')}
        autoCorrect={false}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Icon name="snippets" size={48} color={colors.textTertiary} />
              <Typography variant="body" color="secondary" center>
                {t('snippets.empty')}
              </Typography>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeader}>
              <View style={styles.sourceRow}>
                <Icon name={SOURCE_ICON[item.source]} size={14} color={colors.textTertiary} />
                <Typography variant="caption" color="tertiary" style={styles.cardSource}>
                  {t(`snippets.source.${item.source}`)}
                </Typography>
              </View>
              <TouchableOpacity
                testID="snippet-delete"
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}
                onPress={() => confirmDelete(item)}
              >
                <Icon name="delete" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Typography variant="h3">{item.title}</Typography>
            <View style={styles.cardBody}>
              <MarkdownRenderer content={item.content} />
            </View>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <Badge key={tag} label={`#${tag}`} tone="default" />
                ))}
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.lg, paddingBottom: 0 },

  search: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardSource: { textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { marginTop: Spacing.xs },
  tagRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap' },
});
