import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New supporter', body: 'Sita Rai started supporting you.', time: '2h ago' },
  { id: '2', title: 'Comment', body: 'Ram Thapa commented on your post.', time: '5h ago' },
  { id: '3', title: 'Like', body: 'Anita Karki liked your post.', time: '1d ago' },
];

export default function NotificationsTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      {MOCK_NOTIFICATIONS.map((n) => (
        <View key={n.id} style={styles.item}>
          <Text style={styles.itemTitle}>{n.title}</Text>
          <Text style={styles.itemBody}>{n.body}</Text>
          <Text style={styles.itemTime}>{n.time}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  item: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  itemBody: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  itemTime: { fontSize: 12, color: colors.mutedForeground, marginTop: 6 },
});
