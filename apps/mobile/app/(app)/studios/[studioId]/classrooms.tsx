import { useQuery } from '@tanstack/react-query';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../src/lib/api';
import type { Classroom } from '@gam/shared';

export default function ClassroomsScreen() {
  const { studioId } = useLocalSearchParams<{ studioId: string }>();
  const router = useRouter();

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ['classrooms', studioId],
    queryFn: () => api.get<Classroom[]>(`/classrooms?studioId=${studioId}`),
    enabled: !!studioId,
  });

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <View style={styles.container}>
      {classrooms.length === 0 && (
        <Text style={styles.empty}>No classrooms yet.</Text>
      )}
      <FlatList
        data={classrooms}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/classrooms/${item.id}/calendar`)}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
            <Text style={styles.cardSub}>{item.timezone}</Text>
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
  cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
