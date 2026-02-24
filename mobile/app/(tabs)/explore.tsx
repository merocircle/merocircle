import { ScrollView, Text, StyleSheet, View, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { CreatorCard } from '../../components/ui';
import { colors } from '../../constants/colors';
import { useDiscover } from '../../hooks/useDiscover';

export default function ExploreTab() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDiscover();

  if (isLoading && !data) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading…</Text>
      </ScrollView>
    );
  }

  if (isError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load explore'}</Text>
      </ScrollView>
    );
  }

  const trending = data?.trending_creators ?? [];
  const suggested = data?.suggested_creators ?? [];
  const creators = trending.length > 0 ? trending : suggested;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>Explore creators</Text>
      {creators.length === 0 ? (
        <Text style={styles.muted}>No creators to show yet.</Text>
      ) : (
        creators.map((c) => {
          const slug = c.vanity_username ?? c.user_id;
          return (
            <View key={c.user_id} style={styles.creatorCard}>
              <CreatorCard
                displayName={c.display_name}
                username={c.vanity_username ?? `user-${c.user_id.slice(0, 8)}`}
                avatarUri={c.avatar_url}
                category={c.category ?? undefined}
                supporterCount={c.supporter_count}
                onPress={() => router.push(`/creator/${slug}`)}
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  creatorCard: { marginBottom: 16 },
  muted: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 14, color: colors.destructive },
});
