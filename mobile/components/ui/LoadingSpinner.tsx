import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export function LoadingSpinner() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
