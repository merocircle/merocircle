import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CreatorCard } from '../../components/ui';
import { colors } from '../../constants/colors';

const MOCK_CREATORS = [
  { slug: 'sita-rai', displayName: 'Sita Rai', username: 'sitarai', category: 'Music', supporterCount: 1200 },
  { slug: 'ram-thapa', displayName: 'Ram Thapa', username: 'ramthapa', category: 'Photography', supporterCount: 890 },
  { slug: 'anita-karki', displayName: 'Anita Karki', username: 'anitakarki', category: 'Vlog', supporterCount: 2100 },
];

export default function ExploreTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore creators</Text>
      {MOCK_CREATORS.map((c) => (
        <View key={c.slug} style={styles.creatorCard}>
          <CreatorCard
            displayName={c.displayName}
            username={c.username}
            category={c.category}
            supporterCount={c.supporterCount}
            onPress={() => router.push(`/creator/${c.slug}`)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  creatorCard: { marginBottom: 16 },
});
