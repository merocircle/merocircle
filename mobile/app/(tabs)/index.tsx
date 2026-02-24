import { ScrollView, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { PostCard } from '../../components/ui';
import { colors } from '../../constants/colors';
import { useFeed } from '../../hooks/useFeed';

export default function HomeTab() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useFeed();

  if (isLoading && !data) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading feed…</Text>
      </ScrollView>
    );
  }

  if (isError) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <Text style={styles.error}>{(error as Error)?.message ?? 'Failed to load feed'}</Text>
      </ScrollView>
    );
  }

  const posts = data?.posts ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
      }
    >
      <Text style={styles.title}>Feed</Text>
      {posts.length === 0 ? (
        <Text style={styles.muted}>No posts yet. Explore creators to see their posts here.</Text>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            authorName={p.creator?.display_name ?? 'Creator'}
            authorAvatar={p.creator?.photo_url}
            content={p.content ?? '[Support this creator to view this post]'}
            imageUri={p.image_url ?? (p.image_urls?.[0]) ?? null}
            likeCount={p.likes_count}
            commentCount={p.comments_count}
            style={styles.postCard}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  postCard: { marginBottom: 16 },
  muted: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 14, color: colors.destructive },
});
