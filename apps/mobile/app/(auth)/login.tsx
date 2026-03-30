import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/context/auth-context';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'gam' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.phonenumbers.read',
        'https://www.googleapis.com/auth/user.addresses.read',
      ],
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      handleCodeExchange(response.params.code);
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Google login failed');
    }
  }, [response]);

  const handleCodeExchange = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{
        accessToken: string;
        needsOnboarding: boolean;
      }>('/auth/google/mobile/exchange', { code });

      await login(data.accessToken);
      router.replace('/(app)/studios');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>GAM</Text>
        <Text style={styles.subtitle}>General Academic Manager</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          {loading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <Text style={styles.googleButtonText}>Google로 로그인</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
});
