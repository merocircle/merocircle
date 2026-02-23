import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { colors } from '../../constants/colors';

type CreatorCardProps = {
  displayName: string;
  username?: string;
  avatarUri?: string | null;
  category?: string;
  supporterCount?: number;
  onPress?: () => void;
};

export function CreatorCard({ displayName, username, avatarUri, category, supporterCount = 0, onPress }: CreatorCardProps) {
  const content = (
    <Card>
      <View style={styles.row}>
        <Avatar source={avatarUri ? { uri: avatarUri } : null} fallback={displayName} size={48} />
        <View style={styles.info}>
          <Text style={styles.displayName}>{displayName}</Text>
          {username ? <Text style={styles.username}>@{username}</Text> : null}
          {category ? <Badge label={category} variant="primary" style={styles.badge} /> : null}
          <Text style={styles.meta}>{supporterCount} supporters</Text>
        </View>
      </View>
    </Card>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { marginLeft: 12, flex: 1 },
  displayName: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  username: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  badge: { marginTop: 6 },
  meta: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
});
