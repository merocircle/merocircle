import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Button } from '../../components/ui';
import { colors } from '../../constants/colors';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.placeholder}>Email, password, connected accounts — Phase 3</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.placeholder}>Push and email preferences — Phase 3</Text>
      </View>
      <Button title="Sign out" onPress={() => {}} variant="outline" style={styles.signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  placeholder: { fontSize: 14, color: colors.mutedForeground, marginTop: 6 },
  signOut: { marginTop: 16 },
});
