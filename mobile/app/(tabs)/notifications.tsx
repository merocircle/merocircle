import { useState, useCallback } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/theme';
import { Button } from '../../components/ui';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { useAuth } from '../../contexts/auth-context';
import {
  useNotificationsData,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getNotificationLink,
  type NotificationType,
} from '../../hooks/useNotifications';

const FILTERS: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'like', label: 'Likes' },
  { value: 'comment', label: 'Comments' },
  { value: 'payment', label: 'Payments' },
  { value: 'follow', label: 'Follows' },
];

export default function NotificationsTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificationsData(
    filter === 'all' ? undefined : filter
  );
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const handleNotificationPress = useCallback(
    (n: (typeof notifications)[0]) => {
      const link = getNotificationLink(n.type, n.post?.id, n.post?.creator_id, user?.id);
      if (link) router.push(link as any);
    },
    [user?.id]
  );

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading notifications…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load notifications'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Button
            title="Mark all read"
            variant="outline"
            onPress={() => markAllAsRead()}
            style={styles.markAllBtn}
            textStyle={styles.markAllText}
          />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setFilter(opt.value)}
            style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterLabel, filter === opt.value && styles.filterLabelActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications yet.`}
            </Text>
          </View>
        ) : (
          filtered.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.user?.name ?? 'Someone'}
              message={n.message}
              createdAt={n.created_at}
              isRead={n.read}
              user={n.user}
              onPress={() => handleNotificationPress(n)}
              onMarkAsRead={() => markAsRead([n.id])}
              style={styles.item}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.md },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primaryForeground },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 13, color: colors.mutedForeground },
  filtersScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border },
  filtersContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.muted },
  filterChipActive: { backgroundColor: colors.primary },
  filterLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  filterLabelActive: { color: colors.primaryForeground },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  item: { marginBottom: 8 },
  muted: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 14, color: colors.destructive },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
});
