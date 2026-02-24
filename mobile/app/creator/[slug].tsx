import { ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Avatar, Badge, Button, PostCard } from '../../components/ui';
import { colors } from '../../constants/colors';
import { useCreator } from '../../hooks/useCreator';

export default function CreatorProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const creatorQuery = useCreator(slug ?? null);
  const { data, isLoading, isError, error } = creatorQuery;
  const details = data?.creatorDetails;
  const posts = data?.posts ?? [];

  if (!slug) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <Text style={styles.muted}>Missing creator</Text>
      </ScrollView>
    );
  }

  if (isLoading && !details) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading creator…</Text>
      </ScrollView>
    );
  }

  if (isError || !details) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centered}>
        <Text style={styles.error}>{(error as Error)?.message ?? 'Creator not found'}</Text>
      </ScrollView>
    );
  }

  const displayName = details.display_name ?? 'Creator';
  const username = details.username ?? slug;
  const category = details.category ?? undefined;
  const supporterCount = details.supporter_count ?? details.supporters_count ?? 0;
  const bio = details.bio ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Avatar
        source={details.avatar_url ? { uri: details.avatar_url } : null}
        fallback={displayName}
        size={72}
        style={styles.avatar}
      />
      <Text style={styles.displayName}>{displayName}</Text>
      <Text style={styles.username}>@{username}</Text>
      {category ? <Badge label={category} variant="primary" style={styles.badge} /> : null}
      <Text style={styles.supporterCount}>{supporterCount} supporters</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      <Button title="Support" onPress={() => {}} style={styles.supportBtn} />
      <Text style={styles.sectionTitle}>Recent posts</Text>
      {posts.length === 0 ? (
        <Text style={styles.muted}>No posts yet.</Text>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            authorName={p.creator?.display_name ?? 'Creator'}
            authorAvatar={p.creator?.photo_url}
            content={p.content ?? '[Support to view]'}
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
  content: { padding: 24, paddingBottom: 32, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  avatar: { marginBottom: 12 },
  displayName: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  username: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  badge: { marginTop: 8 },
  supporterCount: { fontSize: 13, color: colors.mutedForeground, marginTop: 8 },
  bio: { fontSize: 14, color: colors.foreground, textAlign: 'center', marginTop: 12, paddingHorizontal: 16 },
  supportBtn: { marginTop: 20, alignSelf: 'stretch' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, alignSelf: 'flex-start', marginTop: 24, marginBottom: 12 },
  postCard: { marginBottom: 16, width: '100%' },
  muted: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 14, color: colors.destructive },
});
