import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAdminUsers, useSetUserRole } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { AdminUser, AppRole } from '@/types/admin';
import { Badge, Button, Card, Icon, Typography } from '@/components/common';
import { Radius, Spacing } from '@/config/theme';

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
    <Card style={styles.row}>
      <View style={styles.rowHeader}>
        <Typography variant="label" numberOfLines={1} style={styles.email}>
          {item.email || item.id}
        </Typography>
        {isSelf && <Badge label={t('admin.you')} tone="accent" />}
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
              <Typography
                variant="label"
                color={selected ? 'inverted' : 'secondary'}
                center
              >
                {t(`admin.roles.${role}`)}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
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
        <View style={styles.headerTitle}>
          <Icon name="users" size={22} color={colors.accent} />
          <Typography variant="h2">{t('admin.title')}</Typography>
        </View>
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('admin.subtitle')}
        </Typography>
      </View>

      {errorMsg && (
        <Typography
          testID="admin-error"
          variant="bodySm"
          color={colors.error}
          style={[styles.banner, { backgroundColor: colors.errorSurface }]}
        >
          {errorMsg}
        </Typography>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Typography variant="body" color={colors.error}>{t('admin.loadError')}</Typography>
          <Button title={t('common.retry')} variant="ghost" onPress={() => refetch()} />
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
            <Typography variant="body" color="secondary" center style={styles.empty}>
              {t('admin.empty')}
            </Typography>
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
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  banner: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: { gap: Spacing.md },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  email: { flex: 1 },
  roleSelector: { flexDirection: 'row', gap: Spacing.sm },
  rolePill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  empty: { marginTop: Spacing.xxxl },
});
