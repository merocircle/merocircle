import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/theme';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
}

type TabsProps<T extends string> = {
  options: TabOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  style?: ViewStyle;
};

export function Tabs<T extends string>({ options, value, onValueChange, style }: TabsProps<T>) {
  return (
    <View style={[styles.list, style]}>
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          onPress={() => onValueChange(opt.id)}
          style={[styles.trigger, value === opt.id && styles.triggerActive]}
        >
          <Text style={[styles.label, value === opt.id && styles.labelActive]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  trigger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 14, fontWeight: '500', color: colors.mutedForeground },
  labelActive: { color: colors.foreground, fontWeight: '600' },
});
