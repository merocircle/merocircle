import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
});
