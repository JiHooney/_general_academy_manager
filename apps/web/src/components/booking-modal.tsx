'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '../lib/api';
import type { UserPublic } from '@gam/shared';

interface Props {
  classroomId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ classroomId, onClose, onSuccess }: Props) {
  const t = useTranslations();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const toISO = (local: string) => local ? new Date(local).toISOString() : '';

  const { data: teachers = [], refetch: fetchTeachers, isFetching } = useQuery({
    queryKey: ['recommend', classroomId, startAt, endAt],
    queryFn: () =>
      api.post<UserPublic[]>(`/classrooms/${classroomId}/teachers/recommend`, {
        startAt: toISO(startAt),
        endAt: toISO(endAt),
      }),
    enabled: false,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${classroomId}/requests`, {
        startAt: toISO(startAt),
        endAt: toISO(endAt),
        requestedTeacherId: selectedTeacher || undefined,
        message,
      }),
    onSuccess,
    onError: (err: any) => {
      if (err.code === 'schedule.conflict') {
        setError(t('schedule.conflict'));
      } else {
        setError(err.message || t('common.error'));
      }
    },
  });

  const handleRecommend = async () => {
    if (!startAt || !endAt) return;
    setHasSearched(true);
    fetchTeachers();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('booking.request')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('booking.startAt')}</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => {
              setStartAt(e.target.value);
              // End Time이 Start Time보다 이전이면 초기화
              if (endAt && e.target.value && endAt <= e.target.value) {
                setEndAt('');
              }
            }}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('booking.endAt')}</label>
          {!startAt && (
            <p className="text-xs text-amber-600 mb-1">⚠ Start Time을 먼저 선택해주세요.</p>
          )}
          <input
            type="datetime-local"
            value={endAt}
            min={startAt || undefined}
            disabled={!startAt}
            onChange={(e) => {
              if (startAt && e.target.value <= startAt) {
                setError('종료 시간은 시작 시간 이후여야 합니다.');
                setEndAt('');
                return;
              }
              setError('');
              setEndAt(e.target.value);
            }}
            className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          />
        </div>

        {/* Teacher section */}
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">{t('booking.teacher')}</label>
            <button
              type="button"
              onClick={handleRecommend}
              disabled={!startAt || !endAt || isFetching}
              className="ml-auto text-sm text-primary-600 border border-primary-600 px-3 py-1 rounded-lg hover:bg-primary-50 disabled:opacity-50"
            >
              {isFetching ? '...' : t('booking.recommend')}
            </button>
          </div>

          {hasSearched && (
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— any available teacher —</option>
              {teachers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.email})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('booking.message')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!startAt || !endAt || submitMutation.isPending}
            className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? '...' : t('common.submit')}
          </button>
          <button onClick={onClose} className="flex-1 border py-2 rounded-lg">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
