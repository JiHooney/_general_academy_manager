'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '../../../../../lib/api';
import type { Appointment, BookingRequest, UserPublic } from '@gam/shared';
import { BookingModal } from '../../../../../components/booking-modal';
import { RequestDetailModal } from '../../../../../components/request-detail-modal';
import { NavHeader } from '../../../../../components/nav-header';

interface CalendarData {
  appointments: Appointment[];
  pendingRequests: BookingRequest[];
}

type ViewMode = 'month' | 'week' | 'day';

interface Props {
  params: { locale: string; classroomId: string };
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

// 수락된 수업 클릭 시 수정/취소 요청 모달
function AppointmentActionModal({
  appointment,
  classroomId,
  me,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  classroomId: string;
  me: { id: string; role: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<'reschedule' | 'cancel' | null>(null);
  const [newStart, setNewStart] = useState((appointment.startAt as unknown as string).slice(0, 16));
  const [newEnd, setNewEnd] = useState((appointment.endAt as unknown as string).slice(0, 16));
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${classroomId}/requests`, {
        requestedTeacherId: (appointment as any).teacherId ?? (appointment as any).teacher?.id,
        startAt: type === 'reschedule' ? new Date(newStart).toISOString() : appointment.startAt,
        endAt: type === 'reschedule' ? new Date(newEnd).toISOString() : appointment.endAt,
        message: message || (type === 'cancel' ? '수업 취소 요청' : '수업 시간 변경 요청'),
        requestType: type,
        appointmentId: appointment.id,
      }),
    onSuccess: () => {
      setDone(true);
      onSuccess();
    },
  });

  const fmtDt = (iso: string | Date) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow-xl">
          <div className="text-5xl">✅</div>
          <p className="text-lg font-bold">요청이 전송되었습니다</p>
          <p className="text-sm text-gray-500">선생님이 검토 후 처리해드립니다.</p>
          <button onClick={onClose} className="bg-primary-600 text-white px-6 py-2 rounded-lg">닫기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">수업 요청</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <p><span className="font-medium">시작:</span> {fmtDt(appointment.startAt)}</p>
          <p><span className="font-medium">종료:</span> {fmtDt(appointment.endAt)}</p>
        </div>

        {!type ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">어떤 요청을 하시겠습니까?</p>
            <button onClick={() => setType('reschedule')}
              className="w-full border-2 border-blue-200 rounded-xl p-3 text-left hover:bg-blue-50 transition">
              <p className="font-semibold text-blue-700">🕐 시간 변경 요청</p>
              <p className="text-xs text-gray-500 mt-0.5">다른 시간으로 변경을 요청합니다</p>
            </button>
            <button onClick={() => setType('cancel')}
              className="w-full border-2 border-red-200 rounded-xl p-3 text-left hover:bg-red-50 transition">
              <p className="font-semibold text-red-600">❌ 수업 취소 요청</p>
              <p className="text-xs text-gray-500 mt-0.5">이 수업을 취소 요청합니다</p>
            </button>
          </div>
        ) : type === 'reschedule' ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">변경할 시간을 입력하세요</p>
            <div>
              <label className="text-xs text-gray-500">새 시작 시간</label>
              <input type="datetime-local" value={newStart} onChange={e => setNewStart(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">새 종료 시간</label>
              <input type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">메시지 (선택)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="변경 이유" rows={2}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setType(null)} className="flex-1 border rounded-lg py-2 text-sm">뒤로</button>
              <button onClick={() => submitMutation.mutate()}
                disabled={!newStart || !newEnd || submitMutation.isPending}
                className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {submitMutation.isPending ? '전송 중...' : '변경 요청'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">정말로 이 수업을 취소 요청하시겠습니까?</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="취소 이유 (선택)" rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setType(null)} className="flex-1 border rounded-lg py-2 text-sm">뒤로</button>
              <button onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {submitMutation.isPending ? '전송 중...' : '취소 요청'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage({ params: { classroomId, locale } }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<ViewMode>('month');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ id: string; role: string }>('/auth/me'),
  });

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', classroomId, year, month],
    queryFn: () =>
      api.get<CalendarData>(`/classrooms/${classroomId}/calendar?from=${from}&to=${to}`),
  });

  const days = getMonthDays(year, month);
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const appointmentsByDay = new Map<number, Appointment[]>();
  data?.appointments.forEach((a) => {
    const d = new Date(a.startAt).getDate();
    if (!appointmentsByDay.has(d)) appointmentsByDay.set(d, []);
    appointmentsByDay.get(d)!.push(a);
  });

  const pendingByDay = new Map<number, BookingRequest[]>();
  data?.pendingRequests.forEach((r) => {
    const d = new Date(r.startAt).getDate();
    if (!pendingByDay.has(d)) pendingByDay.set(d, []);
    pendingByDay.get(d)!.push(r);
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const fmtTime = (iso: string | Date) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <NavHeader locale={locale} title={t('classroom.calendar')} showBack backHref={`/${locale}/studios`} />

      <main className="max-w-5xl mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('classroom.calendar')}</h1>
        <div className="flex items-center gap-2">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-sm ${
                view === v ? 'bg-primary-600 text-white' : 'border text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t(`schedule.${v}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100">◀</button>
        <span className="font-semibold text-lg">
          {monthNames[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100">▶</button>
      </div>

      {/* Calendar Grid (month view) */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-gray-500 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const appts = day ? (appointmentsByDay.get(day) ?? []) : [];
              const pending = day ? (pendingByDay.get(day) ?? []) : [];
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();
              return (
                <div
                  key={idx}
                  className="min-h-[80px] p-2 border-b border-r last:border-r-0 hover:bg-gray-50 transition"
                >
                  {day && (
                    <>
                      <span
                        className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {appts.slice(0, 2).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAppt(a)}
                            className="w-full text-left text-xs bg-primary-100 text-primary-700 rounded px-1 py-0.5 truncate hover:bg-primary-200 transition"
                            title={`${fmtTime(a.startAt as unknown as string)}~${fmtTime(a.endAt as unknown as string)}`}
                          >
                            {fmtTime(a.startAt as unknown as string)}~{fmtTime(a.endAt as unknown as string)}
                          </button>
                        ))}
                        {pending.slice(0, 2).map((r) => (
                          <div
                            key={r.id}
                            className="text-xs bg-yellow-100 text-yellow-700 rounded px-1 truncate cursor-pointer hover:bg-yellow-200 transition"
                            title={`요청중 ${fmtTime(r.startAt as unknown as string)}`}
                            onClick={() => setSelectedRequest(r)}
                          >
                            요청중 {fmtTime(r.startAt as unknown as string)}
                          </div>
                        ))}
                        {(appts.length + pending.length) > 2 && (
                          <div className="text-xs text-gray-400">+{appts.length + pending.length - 2}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(view === 'week' || view === 'day') && (
        <div className="bg-white rounded-2xl p-6 border text-center text-gray-400">
          {view === 'week' ? 'Week view — coming soon' : 'Day view — coming soon'}
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-center">{t('common.loading')}</p>}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-2 items-start">
        <button
          onClick={() => setShowBooking(true)}
          className="bg-primary-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary-700 transition text-2xl"
          title={t('schedule.addEvent')}
        >
          +
        </button>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          classroomId={classroomId}
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['calendar', classroomId] });
            setShowBooking(false);
          }}
        />
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          classroomId={classroomId}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {selectedAppt && me && (
        <AppointmentActionModal
          appointment={selectedAppt}
          classroomId={classroomId}
          me={me}
          onClose={() => setSelectedAppt(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['calendar', classroomId] });
          }}
        />
      )}
    </main>
    </>
  );
}
