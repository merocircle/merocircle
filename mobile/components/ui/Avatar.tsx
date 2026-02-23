import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

type AvatarProps = {
  source?: { uri: string } | number | null;
  fallback?: string;
  size?: number;
  style?: ViewStyle;
};

export function Avatar({ source, fallback = '?', size = 40, style }: AvatarProps) {
  const initials = fallback.slice(0, 2).toUpperCase();
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {source ? (
        <Image source={typeof source === 'number' ? source : { uri: source.uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  img: { backgroundColor: colors.muted },
  fallback: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: colors.primaryForeground, fontWeight: '600' },
});
