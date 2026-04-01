'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '../lib/api';
import type { UserPublic } from '@gam/shared';

interface Props {
  classroomId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string; // YYYY-MM-DD
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // 01~12
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function buildISO(date: string, hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  if (!date || !hour || !minute) return '';
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return new Date(`${date}T${String(h).padStart(2, '0')}:${minute}:00`).toISOString();
}

function isComplete(date: string, hour: string, minute: string, ampm: 'AM' | 'PM') {
  return !!date && !!hour && !!minute && !!ampm;
}

export function BookingModal({ classroomId, onClose, onSuccess, initialDate }: Props) {
  const t = useTranslations();

  const todayStr = new Date().toISOString().slice(0, 10);

  // 날짜
  const [startDate, setStartDate] = useState(initialDate || todayStr);
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startAmpm, setStartAmpm] = useState<'AM' | 'PM'>('AM');
  const [showStartCal, setShowStartCal] = useState(!initialDate);

  const [endDate, setEndDate] = useState(initialDate || todayStr);
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endAmpm, setEndAmpm] = useState<'AM' | 'PM'>('AM');

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 시작 날짜/시간 완성되면 달력 숨김
  useEffect(() => {
    if (isComplete(startDate, startHour, startMinute, startAmpm)) {
      setShowStartCal(false);
    }
  }, [startDate, startHour, startMinute, startAmpm]);

  const startISO = buildISO(startDate, startHour, startMinute, startAmpm);
  const endISO = buildISO(endDate, endHour, endMinute, endAmpm);

  // 종료 시간이 시작 시간 이하면 에러
  const endInvalid = !!startISO && !!endISO && endISO <= startISO;

  // 클래스룸 선생님 목록 조회
  const { data: teachers = [] } = useQuery({
    queryKey: ['classroom-teachers', classroomId],
    queryFn: () => api.get<UserPublic[]>(`/classrooms/${classroomId}/teachers`),
  });

  // 첫 번째 선생님 자동 선택
  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacher) {
      setSelectedTeacher(teachers[0].id);
    }
  }, [teachers]);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${classroomId}/requests`, {
        startAt: startISO,
        endAt: endISO,
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

  const canSubmit = isComplete(startDate, startHour, startMinute, startAmpm)
    && isComplete(endDate, endHour, endMinute, endAmpm)
    && !endInvalid;

  const TimeSelector = ({
    label, date, setDate, hour, setHour, minute, setMinute, ampm, setAmpm,
    minISO,
  }: {
    label: string;
    date: string; setDate: (v: string) => void;
    hour: string; setHour: (v: string) => void;
    minute: string; setMinute: (v: string) => void;
    ampm: 'AM' | 'PM'; setAmpm: (v: 'AM' | 'PM') => void;
    minISO?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type="date"
        value={date}
        min={minISO ? minISO.slice(0, 10) : todayStr}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-2">
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="border rounded-lg px-2 py-2 text-sm"
        >
          <option value="">시</option>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="border rounded-lg px-2 py-2 text-sm"
        >
          <option value="">분</option>
          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={ampm}
          onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
          className="border rounded-lg px-2 py-2 text-sm"
        >
          <option value="AM">오전</option>
          <option value="PM">오후</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('booking.request')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        <TimeSelector
          label="시작 시간"
          date={startDate} setDate={setStartDate}
          hour={startHour} setHour={setStartHour}
          minute={startMinute} setMinute={setStartMinute}
          ampm={startAmpm} setAmpm={setStartAmpm}
        />

        <TimeSelector
          label="종료 시간"
          date={endDate} setDate={setEndDate}
          hour={endHour} setHour={setEndHour}
          minute={endMinute} setMinute={setEndMinute}
          ampm={endAmpm} setAmpm={setEndAmpm}
          minISO={startISO || undefined}
        />
        {endInvalid && (
          <p className="text-red-500 text-xs">종료 시간은 시작 시간 이후여야 합니다.</p>
        )}

        {/* 선생님 선택 */}
        <div>
          <label className="block text-sm font-medium mb-1">선생님 선택</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {teachers.length === 0 && <option value="">선생님 없음</option>}
            {teachers.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('booking.message')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="메시지 (선택사항)"
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
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
