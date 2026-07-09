import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { filterGlossary, GLOSSARY, type GlossaryEntry } from '@/data/glossary';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

const CATEGORY_BADGES: Record<GlossaryEntry['category'], string> = {
  csharp: '💜 C#',
  oop: '🧩 OOP',
  dotnet: '🔵 .NET',
  tooling: '🛠️ Tooling',
  general: '🧠 General',
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('glossary.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('glossary.subtitle')}
      </Text>

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
          placeholder={t('glossary.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={[styles.clear, { color: colors.textTertiary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

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
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.textInverted : colors.textSecondary },
                ]}
              >
                {cat === 'all' ? t('glossary.allCategories') : CATEGORY_BADGES[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textTertiary, fontSize: FontSize.md }}>
              {t('common.noResults')}
            </Text>
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
              <Text style={[styles.term, { color: colors.textPrimary }]}>{item.term}</Text>
              <Text style={[styles.badge, { color: colors.textTertiary }]}>
                {CATEGORY_BADGES[item.category]}
              </Text>
            </View>
            <Text style={[styles.definition, { color: colors.textSecondary }]}>
              {translate(item.definition)}
            </Text>
            {item.keywords && item.keywords.length > 0 && (
              <Text style={[styles.keywords, { color: colors.textTertiary }]}>
                {item.keywords.map((k) => `#${k}`).join(' ')}
              </Text>
            )}
          </View>
        )}
      />

      <Text style={[styles.footer, { color: colors.textTertiary }]}>
        {t('glossary.totalEntries', { count: GLOSSARY.length })}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  back: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, paddingHorizontal: Spacing.lg, marginTop: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md },
  clear: { fontSize: 16 },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  list: { padding: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.xl },
  empty: { alignItems: 'center', padding: Spacing.xl },
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
    marginBottom: Spacing.xs,
  },
  term: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  badge: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  definition: { fontSize: FontSize.sm, lineHeight: 20 },
  keywords: { fontSize: FontSize.xs, marginTop: 6, fontStyle: 'italic' },

  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    paddingVertical: Spacing.sm,
  },
});
