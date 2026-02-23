import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { Avatar } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_CHATS = [
  { id: '1', name: 'Sita Rai', lastMessage: 'Thanks for supporting!', time: '2h ago', unread: 1 },
  { id: '2', name: 'Ram Thapa', lastMessage: 'Sure, we can collab next week.', time: '1d ago', unread: 0 },
];

export default function ChatScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Messages</Text>
      {MOCK_CHATS.map((c) => (
        <Pressable key={c.id} style={styles.row} onPress={() => {}}>
          <Avatar fallback={c.name} size={48} />
          <View style={styles.info}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.time}>{c.time}</Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>{c.lastMessage}</Text>
          </View>
          {c.unread > 0 ? <View style={styles.unread} /> : null}
        </Pressable>
      ))}
      <Text style={styles.placeholder}>Tap a chat to open — Stream in Phase 3</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.card, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  info: { marginLeft: 12, flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  time: { fontSize: 12, color: colors.mutedForeground },
  lastMessage: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 8 },
  placeholder: { fontSize: 13, color: colors.mutedForeground, marginTop: 16, textAlign: 'center' },
});
