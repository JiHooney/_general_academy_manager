import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/auth-context';

export default function Index() {
  const { isLoggedIn } = useAuth();
  return <Redirect href={isLoggedIn ? '/(app)/studios' : '/(auth)/login'} />;
}
