import { ScrollView, Text, StyleSheet } from 'react-native';
import { PostCard } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_POSTS = [
  { id: '1', authorName: 'Sita Rai', content: 'Excited to share my new music video with you all. Thank you for your support! 🙏', likeCount: 42, commentCount: 8 },
  { id: '2', authorName: 'Ram Thapa', content: 'Behind the scenes from our latest shoot in Pokhara. The mountains never disappoint.', likeCount: 128, commentCount: 15 },
  { id: '3', authorName: 'Anita Karki', content: 'New vlog is up — a day in my life as a creator in Kathmandu. Link in bio.', likeCount: 56, commentCount: 12 },
];

export default function HomeTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feed</Text>
      {MOCK_POSTS.map((p) => (
        <PostCard key={p.id} authorName={p.authorName} content={p.content} likeCount={p.likeCount} commentCount={p.commentCount} style={styles.postCard} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  postCard: { marginBottom: 16 },
});
