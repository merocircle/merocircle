import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_USER = { displayName: 'You', username: 'you', supporterCount: 0, supportingCount: 3 };

export default function ProfileTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar fallback={MOCK_USER.displayName} size={80} />
        <Text style={styles.displayName}>{MOCK_USER.displayName}</Text>
        <Text style={styles.username}>@{MOCK_USER.username}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{MOCK_USER.supportingCount} supporting</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Creator Studio" onPress={() => router.push('/creator-studio')} style={styles.btn} />
        <Button title="Settings" onPress={() => router.push('/settings')} variant="outline" style={styles.btn} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 24 },
  displayName: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginTop: 12 },
  username: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  stats: { flexDirection: 'row', marginTop: 8, gap: 16 },
  stat: { fontSize: 13, color: colors.mutedForeground },
  actions: { gap: 12 },
  btn: { marginBottom: 0 },
});
