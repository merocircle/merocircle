import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const logoSource = require('../assets/images/logo.png');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logoText}>MeroCircle</Text>
        <Text style={styles.tagline}>Creator support for Nepal</Text>
      </View>
      <Text style={styles.comingSoon}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  comingSoon: {
    fontSize: 16,
    color: colors.mutedForeground,
  },
});
