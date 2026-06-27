import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAdminUsers, useSetUserRole } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { AdminUser, AppRole } from '@/types/admin';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

const ROLE_ORDER: AppRole[] = ['learner', 'instructor', 'admin'];

function UserRow({
  item,
  isSelf,
  updating,
  onSetRole,
}: {
  item: AdminUser;
  isSelf: boolean;
  updating: boolean;
  onSetRole: (role: AppRole) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.rowHeader}>
        <Text style={[styles.email, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.email || item.id}
        </Text>
        {isSelf && (
          <View style={[styles.youBadge, { backgroundColor: colors.primarySurface }]}>
            <Text style={[styles.youBadgeText, { color: colors.primary }]}>{t('admin.you')}</Text>
          </View>
        )}
        {updating && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <View style={styles.roleSelector}>
        {ROLE_ORDER.map((role) => {
          const selected = item.role === role;
          const disabled = isSelf || updating;
          return (
            <TouchableOpacity
              key={role}
              disabled={disabled || selected}
              onPress={() => onSetRole(role)}
              style={[
                styles.rolePill,
                {
                  backgroundColor: selected ? colors.primary : colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
                disabled && !selected && { opacity: 0.4 },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.rolePillText,
                  { color: selected ? colors.textInverted : colors.textSecondary },
                ]}
              >
                {t(`admin.roles.${role}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function AdminUsersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: users, isLoading, isRefetching, error, refetch } = useAdminUsers();
  const setRole = useSetUserRole();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSetRole = (userId: string, role: AppRole) => {
    setErrorMsg(null);
    setRole.mutate(
      { userId, role },
      {
        onError: (err) => {
          console.error('[Admin] set role failed:', err);
          setErrorMsg(t('admin.updateError'));
        },
      },
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🛡️ {t('admin.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('admin.subtitle')}</Text>
      </View>

      {errorMsg && (
        <Text testID="admin-error" style={[styles.banner, { color: colors.error, backgroundColor: colors.errorSurface }]}>
          {errorMsg}
        </Text>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{t('admin.loadError')}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: colors.primary }]}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users ?? []}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <UserRow
              item={item}
              isSelf={item.id === user?.id}
              updating={setRole.isPending && setRole.variables?.userId === item.id}
              onSetRole={(role) => handleSetRole(item.id, role)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('admin.empty')}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  header: { padding: Spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  banner: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  email: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  youBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  youBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  roleSelector: { flexDirection: 'row', gap: Spacing.sm },
  rolePill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  rolePillText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
  errorText: { fontSize: FontSize.md },
  retryText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
