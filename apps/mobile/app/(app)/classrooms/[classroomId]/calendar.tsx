import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../../../src/lib/api';
import type { Appointment, BookingRequest } from '@gam/shared';

interface CalendarData {
  appointments: Appointment[];
  pendingRequests: BookingRequest[];
}

export default function CalendarScreen() {
  const { classroomId } = useLocalSearchParams<{ classroomId: string }>();
  const qc = useQueryClient();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());
  const [showBooking, setShowBooking] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [message, setMessage] = useState('');
  const [bookError, setBookError] = useState('');

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', classroomId, year, month],
    queryFn: () =>
      api.get<CalendarData>(`/classrooms/${classroomId}/calendar?from=${from}&to=${to}`),
    enabled: !!classroomId,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${classroomId}/requests`, { startAt, endAt, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      setShowBooking(false);
    },
    onError: (err: any) => setBookError(err.message || 'Booking failed'),
  });

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  const allEvents = [
    ...(data?.appointments ?? []).map((a) => ({
      id: a.id,
      label: `Appointment`,
      time: new Date(a.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(a.startAt).toLocaleDateString(),
      color: '#dbeafe',
      textColor: '#1d4ed8',
    })),
    ...(data?.pendingRequests ?? []).map((r) => ({
      id: r.id,
      label: 'Pending Request',
      time: new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(r.startAt).toLocaleDateString(),
      color: '#fef9c3',
      textColor: '#92400e',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {monthNames[month]} {year}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />
      ) : allEvents.length === 0 ? (
        <Text style={styles.empty}>No events this month</Text>
      ) : (
        <FlatList
          data={allEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.eventCard, { backgroundColor: item.color }]}>
              <Text style={[styles.eventLabel, { color: item.textColor }]}>{item.label}</Text>
              <Text style={[styles.eventTime, { color: item.textColor }]}>
                {item.date} {item.time}
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowBooking(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Booking Modal */}
      <Modal visible={showBooking} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book a Session</Text>

            <Text style={styles.label}>Start (ISO datetime)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-03-01T09:00:00Z"
              value={startAt}
              onChangeText={setStartAt}
              autoCapitalize="none"
            />

            <Text style={styles.label}>End (ISO datetime)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-03-01T10:00:00Z"
              value={endAt}
              onChangeText={setEndAt}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Message (optional)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              value={message}
              onChangeText={setMessage}
            />

            {bookError ? <Text style={styles.error}>{bookError}</Text> : null}

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
              >
                <Text style={styles.submitBtnText}>
                  {bookMutation.isPending ? '...' : 'Submit'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBooking(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 16 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', margin: 32 },
  eventCard: { borderRadius: 10, padding: 12 },
  eventLabel: { fontWeight: '600', fontSize: 14 },
  eventTime: { fontSize: 12, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  error: { color: '#ef4444', fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  submitBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
});
