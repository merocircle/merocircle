import { useState } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Card } from '../../components/ui';
import { Tabs } from '../../components/ui';
import { Button } from '../../components/ui';
import { PostCard } from '../../components/ui';
import { Avatar } from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';
import { useCreatorDashboard, useCreatorAnalytics } from '../../hooks/useCreatorStudio';
import { useAuth } from '../../contexts/auth-context';

type StudioTab = 'posts' | 'analytics' | 'supporters';

const TAB_OPTIONS = [
  { id: 'posts' as const, label: 'Posts' },
  { id: 'analytics' as const, label: 'Analytics' },
  { id: 'supporters' as const, label: 'Supporters' },
];

export default function CreatorStudioScreen() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<StudioTab>('posts');
  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash, isRefetching: dashRefetching } = useCreatorDashboard();
  const { data: analytics, isLoading: analyticsLoading } = useCreatorAnalytics();

  const isCreator = userProfile?.role === 'creator';
  const loading = dashLoading && !dashboard;
  const stats = dashboard?.stats ?? analytics?.stats;
  const supportersCount = stats?.supporters ?? 0;
  const postsCount = stats?.posts ?? 0;
  const totalEarnings = stats?.totalEarnings ?? (dashboard?.stats?.totalEarnings ?? 0);
  const posts = dashboard?.posts ?? [];
  const supporters = dashboard?.supporters ?? [];
  const topSupporters = analytics?.topSupporters ?? [];
  const earningsChart = analytics?.charts?.earnings ?? [];

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Sign in to access Creator Studio.</Text>
      </View>
    );
  }

  if (!isCreator) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Creator Studio is for creators. Complete onboarding on the web to get started.</Text>
        <Button title="Back" variant="outline" onPress={() => router.back()} style={styles.backBtn} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading your dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={dashRefetching} onRefresh={() => refetchDash()} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>Creator Studio</Text>
      <Text style={styles.subtitle}>Your dashboard</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{supportersCount}</Text>
          <Text style={styles.statLabel}>Supporters</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>रु {totalEarnings.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </Card>
      </View>

      <Button
        title="Create post"
        onPress={() => router.push('/create-post')}
        style={styles.createBtn}
      />

      <Tabs options={TAB_OPTIONS} value={activeTab} onValueChange={(v) => setActiveTab(v)} style={styles.tabs} />

      {activeTab === 'posts' && (
        <View style={styles.tabContent}>
          {posts.length === 0 ? (
            <Text style={styles.emptyText}>No posts yet. Create your first post above.</Text>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                authorName={p.creator?.display_name ?? 'You'}
                authorAvatar={p.creator?.photo_url}
                content={p.content}
                imageUri={p.image_url ?? p.image_urls?.[0]}
                likeCount={p.likes_count}
                commentCount={p.comments_count}
                style={styles.postCard}
              />
            ))
          )}
        </View>
      )}

      {activeTab === 'analytics' && (
        <View style={styles.tabContent}>
          {earningsChart.length > 0 ? (
            <Card style={styles.chartCard}>
              <Text style={styles.cardTitle}>Earnings by month</Text>
              {earningsChart.slice(-6).map((c) => (
                <View key={c.month} style={styles.chartRow}>
                  <Text style={styles.chartMonth}>{c.month}</Text>
                  <Text style={styles.chartValue}>रु {c.earnings.toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          ) : null}
          {topSupporters.length > 0 && (
            <Card style={styles.chartCard}>
              <Text style={styles.cardTitle}>Top supporters</Text>
              {topSupporters.map((s) => (
                <View key={s.id} style={styles.supporterRow}>
                  <Avatar source={s.photo_url ? { uri: s.photo_url } : null} fallback={s.name} size={36} />
                  <Text style={styles.supporterName}>{s.name}</Text>
                  <Text style={styles.supporterAmount}>रु {s.total_amount.toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          )}
          {earningsChart.length === 0 && topSupporters.length === 0 && !analyticsLoading && (
            <Text style={styles.emptyText}>No analytics data yet. Grow your audience to see stats.</Text>
          )}
        </View>
      )}

      {activeTab === 'supporters' && (
        <View style={styles.tabContent}>
          {supporters.length === 0 ? (
            <Text style={styles.emptyText}>No supporters yet. Share your page to get support.</Text>
          ) : (
            supporters.map((s) => (
              <Card key={s.id} style={styles.supporterCard}>
                <Avatar source={s.avatar ? { uri: s.avatar } : null} fallback={s.name} size={44} />
                <View style={styles.supporterInfo}>
                  <Text style={styles.supporterName}>{s.name}</Text>
                  <Text style={styles.supporterMeta}>रु {s.amount.toLocaleString()} · joined recently</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { minWidth: 100, flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  createBtn: { marginBottom: 20 },
  tabs: { marginBottom: 16 },
  tabContent: { gap: 12 },
  postCard: { marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 24 },
  chartCard: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  chartMonth: { fontSize: 14, color: colors.foreground },
  chartValue: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  supporterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  supporterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  supporterInfo: { flex: 1 },
  supporterMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  supporterAmount: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  backBtn: { marginTop: 16 },
  muted: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
});
