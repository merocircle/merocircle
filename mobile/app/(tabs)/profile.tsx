import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button } from '../../components/ui';
import { useAuth } from '../../contexts/auth-context';
import { useSupportedCreators } from '../../hooks/useSupporting';
import { colors } from '../../constants/colors';

export default function ProfileTab() {
  const { userProfile, user } = useAuth();
  const { data: supportingData } = useSupportedCreators();
  const supportingCount = supportingData?.creators?.length ?? 0;
  const displayName = userProfile?.display_name ?? user?.email?.split('@')[0] ?? 'You';
  const email = userProfile?.email ?? user?.email ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar
          source={userProfile?.photo_url ? { uri: userProfile.photo_url } : null}
          fallback={displayName}
          size={80}
        />
        <Text style={styles.displayName}>{displayName}</Text>
        {email ? <Text style={styles.username}>{email}</Text> : null}
        <View style={styles.stats}>
          <Text style={styles.stat}>{supportingCount} supporting</Text>
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
