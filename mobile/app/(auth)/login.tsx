import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../../components/ui';
import { colors } from '../../constants/colors';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with your Google account to continue.</Text>
        <View style={styles.actions}>
          <Button
            title={loading ? 'Signing in…' : 'Sign in with Google'}
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={styles.button}
          />
          {loading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        </View>

        <Pressable onPress={() => setShowHelp((v) => !v)} style={styles.helpToggle}>
          <Text style={styles.helpToggleText}>
            {showHelp ? 'Hide' : 'Sign-in not working? Tap for setup'}
          </Text>
        </Pressable>
        {showHelp && (
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>One-time Supabase setup</Text>
            <Text style={styles.helpStep}>
              1. Go to <Text style={styles.helpBold}>Supabase Dashboard → Authentication → URL Configuration → Redirect URLs</Text>.
            </Text>
            <Text style={styles.helpStep}>
              2. Add this exact URL (works in Expo Go and dev builds):
            </Text>
            <Text style={styles.redirectUri} selectable>
              mobile://auth/callback
            </Text>
            <Text style={styles.helpStep}>
              3. Under <Text style={styles.helpBold}>Authentication → Providers</Text>, enable Google and enter your Google OAuth Web Client ID and Secret.
            </Text>
          </View>
        )}

        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' },
  actions: { marginTop: 32, width: '100%', maxWidth: 320 },
  button: { width: '100%' },
  spinner: { marginTop: 12 },
  helpToggle: { marginTop: 20 },
  helpToggleText: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
  helpBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.mutedForeground + '18',
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'flex-start',
  },
  helpTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  helpStep: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
  helpBold: { fontWeight: '600', color: colors.foreground },
  redirectUri: {
    fontSize: 11,
    color: colors.primary,
    fontFamily: 'monospace',
    marginVertical: 6,
    padding: 6,
    backgroundColor: colors.background,
    borderRadius: 4,
    alignSelf: 'stretch',
  },
  back: { marginTop: 24 },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
});
