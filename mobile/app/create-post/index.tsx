import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../../components/ui';
import { colors } from '../../constants/colors';

export default function CreatePostScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create post</Text>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.hint}>Image upload — Phase 3</Text>
      <Button title="Post" onPress={() => {}} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, fontSize: 16, color: colors.foreground, minHeight: 120, textAlignVertical: 'top' },
  hint: { fontSize: 13, color: colors.mutedForeground, marginTop: 8 },
  btn: { marginTop: 20 },
});
