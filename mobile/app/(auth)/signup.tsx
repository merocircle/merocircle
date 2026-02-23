import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <Text style={styles.placeholder}>Placeholder — auth in Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  placeholder: { fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
});
