import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Card } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_STATS = [
  { label: 'Supporters', value: '24' },
  { label: 'Earnings (this month)', value: 'रु 1,200' },
  { label: 'Posts', value: '12' },
];

export default function CreatorStudioScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Creator Studio</Text>
      <Text style={styles.subtitle}>Your dashboard</Text>
      <View style={styles.stats}>
        {MOCK_STATS.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <Text style={styles.cardBody}>Create post, view analytics, manage tiers — Phase 3</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { minWidth: 100, flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  card: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  cardBody: { fontSize: 14, color: colors.mutedForeground, marginTop: 6 },
});
