import { useQuery } from '@tanstack/react-query';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import type { Studio } from '@gam/shared';

export default function StudiosScreen() {
  const router = useRouter();
  const { data: studios = [], isLoading } = useQuery({
    queryKey: ['studios'],
    queryFn: () => api.get<Studio[]>('/studios'),
  });

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <View style={styles.container}>
      {studios.length === 0 && (
        <Text style={styles.empty}>No studios yet. Create one from the web app.</Text>
      )}
      <FlatList
        data={studios}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/studios/${item.id}/classrooms`)}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.id}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', margin: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
