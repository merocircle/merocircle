import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { colors } from '../../constants/colors';

type PostCardProps = {
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  imageUri?: string | null;
  likeCount?: number;
  commentCount?: number;
  style?: ViewStyle;
};

export function PostCard({ authorName, authorAvatar, content, imageUri, likeCount = 0, commentCount = 0, style }: PostCardProps) {
  return (
    <Card style={style}>
      <View style={styles.header}>
        <Avatar source={authorAvatar ? { uri: authorAvatar } : null} fallback={authorName} size={36} />
        <Text style={styles.authorName}>{authorName}</Text>
      </View>
      <Text style={styles.content} numberOfLines={4}>{content}</Text>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}
      <View style={styles.footer}>
        <Text style={styles.meta}>{likeCount} likes</Text>
        <Text style={styles.meta}>{commentCount} comments</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorName: { marginLeft: 10, fontWeight: '600', color: colors.foreground },
  content: { fontSize: 14, color: colors.foreground, marginBottom: 8 },
  image: { height: 200, borderRadius: 8, marginBottom: 8, backgroundColor: colors.muted },
  footer: { flexDirection: 'row', gap: 16 },
  meta: { fontSize: 12, color: colors.mutedForeground },
});
