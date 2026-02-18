import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../src/lib/api';
import type { Notification } from '@gam/shared';

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />
      ) : !data || data.length === 0 ? (
        <Text style={styles.empty}>No notifications yet</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => n.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.readAt ? styles.cardRead : styles.cardUnread]}
              onPress={() => !item.readAt && readMutation.mutate(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                {!item.readAt && <View style={styles.dot} />}
                <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {item.payload && (
                <Text style={styles.payload} numberOfLines={2}>
                  {typeof item.payload === 'string'
                    ? item.payload
                    : JSON.stringify(item.payload)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', margin: 32, fontSize: 16 },
  card: { borderRadius: 12, padding: 14 },
  cardUnread: { backgroundColor: '#eff6ff', borderLeftWidth: 3, borderLeftColor: '#2563eb' },
  cardRead: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  type: { flex: 1, fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },
  time: { fontSize: 12, color: '#9ca3af' },
  payload: { marginTop: 6, fontSize: 13, color: '#4b5563' },
});
