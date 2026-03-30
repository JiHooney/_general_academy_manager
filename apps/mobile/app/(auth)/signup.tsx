// Signup removed — Google OAuth only. Redirect to login.
import { Redirect } from 'expo-router';

export default function SignupScreen() {
  return <Redirect href="/(auth)/login" />;
}
