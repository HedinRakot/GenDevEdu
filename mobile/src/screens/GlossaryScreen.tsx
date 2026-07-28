import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { filterGlossary, GLOSSARY, type GlossaryEntry } from '@/data/glossary';
import { Badge, Button, Input, Typography } from '@/components/common';
import { Radius, Spacing } from '@/config/theme';
import { showScrollIndicator } from '@/utils/platform';

const CATEGORY_LABELS: Record<GlossaryEntry['category'], string> = {
  csharp: 'C#',
  oop: 'OOP',
  dotnet: '.NET',
  tooling: 'Tooling',
  general: 'General',
};

export function GlossaryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryEntry['category'] | 'all'>('all');

  const filtered = useMemo(() => {
    const byQuery = filterGlossary(query);
    if (activeCategory === 'all') return byQuery;
    return byQuery.filter((entry) => entry.category === activeCategory);
  }, [query, activeCategory]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Button
          variant="ghost"
          size="sm"
          iconLeft="arrow-left"
          title={t('common.back')}
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.heading}>
        <Typography variant="h1">{t('glossary.title')}</Typography>
        <Typography variant="body" color="secondary">
          {t('glossary.subtitle')}
        </Typography>
      </View>

      <Input
        leftIcon="search"
        containerStyle={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('glossary.searchPlaceholder')}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View style={styles.chipRow}>
        {(['all', 'csharp', 'oop', 'dotnet', 'tooling', 'general'] as const).map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Typography variant="label" color={isActive ? 'inverted' : 'secondary'}>
                {cat === 'all' ? t('glossary.allCategories') : CATEGORY_LABELS[cat]}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={showScrollIndicator}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography variant="body" color="tertiary">
              {t('common.noResults')}
            </Typography>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <View style={styles.cardHeader}>
              <Typography variant="h3">{item.term}</Typography>
              <Badge label={CATEGORY_LABELS[item.category]} tone="default" />
            </View>
            <Typography variant="bodySm" color="secondary">
              {translate(item.definition)}
            </Typography>
            {item.keywords && item.keywords.length > 0 && (
              <Typography variant="caption" color="tertiary" style={styles.keywords}>
                {item.keywords.map((k) => `#${k}`).join(' ')}
              </Typography>
            )}
          </View>
        )}
      />

      <Typography variant="caption" color="tertiary" center style={styles.footer}>
        {t('glossary.totalEntries', { count: GLOSSARY.length })}
      </Typography>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  heading: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },

  search: { marginHorizontal: Spacing.lg, marginTop: Spacing.md },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  list: { padding: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.xl },
  empty: { alignItems: 'center', padding: Spacing.xl },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  keywords: { marginTop: 6, fontStyle: 'italic' },

  footer: {
    paddingVertical: Spacing.sm,
  },
});
