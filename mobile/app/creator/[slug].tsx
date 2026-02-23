import { ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Avatar, Badge, Button, PostCard } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_CREATORS: Record<string, { displayName: string; username: string; category: string; supporterCount: number; bio: string }> = {
  'sita-rai': { displayName: 'Sita Rai', username: 'sitarai', category: 'Music', supporterCount: 1200, bio: 'Singer & songwriter from Nepal. Supporting local music.' },
  'ram-thapa': { displayName: 'Ram Thapa', username: 'ramthapa', category: 'Photography', supporterCount: 890, bio: 'Landscape and portrait photographer.' },
  'anita-karki': { displayName: 'Anita Karki', username: 'anitakarki', category: 'Vlog', supporterCount: 2100, bio: 'Daily vlogs and lifestyle from Kathmandu.' },
};

const MOCK_POSTS = [
  { id: '1', authorName: 'Sita Rai', content: 'New single dropping next week. Thank you for your support!', likeCount: 89, commentCount: 12 },
];

export default function CreatorProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const creator = slug ? MOCK_CREATORS[slug] : null;
  const displayName = creator?.displayName ?? slug ?? 'Creator';
  const username = creator?.username ?? '—';
  const category = creator?.category;
  const supporterCount = creator?.supporterCount ?? 0;
  const bio = creator?.bio ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Avatar fallback={displayName} size={72} style={styles.avatar} />
      <Text style={styles.displayName}>{displayName}</Text>
      <Text style={styles.username}>@{username}</Text>
      {category ? <Badge label={category} variant="primary" style={styles.badge} /> : null}
      <Text style={styles.supporterCount}>{supporterCount} supporters</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      <Button title="Support" onPress={() => {}} style={styles.supportBtn} />
      <Text style={styles.sectionTitle}>Recent posts</Text>
      {MOCK_POSTS.map((p) => (
        <PostCard key={p.id} authorName={p.authorName} content={p.content} likeCount={p.likeCount} commentCount={p.commentCount} style={styles.postCard} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32, alignItems: 'center' },
  avatar: { marginBottom: 12 },
  displayName: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  username: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  badge: { marginTop: 8 },
  supporterCount: { fontSize: 13, color: colors.mutedForeground, marginTop: 8 },
  bio: { fontSize: 14, color: colors.foreground, textAlign: 'center', marginTop: 12, paddingHorizontal: 16 },
  supportBtn: { marginTop: 20, alignSelf: 'stretch' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, alignSelf: 'flex-start', marginTop: 24, marginBottom: 12 },
  postCard: { marginBottom: 16, width: '100%' },
});
