import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'primary';
  style?: ViewStyle;
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, variant === 'primary' && styles.primary, style]}>
      <Text style={[styles.text, variant === 'primary' && styles.textPrimary]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.muted, alignSelf: 'flex-start' },
  primary: { backgroundColor: colors.primary },
  text: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  textPrimary: { color: colors.primaryForeground },
});
