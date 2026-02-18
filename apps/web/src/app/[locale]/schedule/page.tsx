'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { NavHeader } from '../../../components/nav-header';
import { BookingModal } from '../../../components/booking-modal';

interface AppointmentItem {
  id: string;
  classroomId: string;
  startAt: string;
  endAt: string;
  status: string;
  note?: string;
  teacher: { id: string; name: string; email: string };
  student: { id: string; name: string; email: string };
  classroom: { id: string; name: string };
}

interface PendingRequestItem {
  id: string;
  classroomId: string;
  startAt: string;
  endAt: string;
  status: string;
  message?: string;
  requestType: string;
  student: { id: string; name: string; email: string };
  requestedTeacher?: { id: string; name: string; email: string };
  classroom: { id: string; name: string };
}

interface CalendarData {
  appointments: AppointmentItem[];
  pendingRequests: PendingRequestItem[];
}

type ViewMode = 'month' | 'week';

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

interface AppointmentModalProps {
  appointment: AppointmentItem;
  me: { id: string; role: string };
  classroomId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AppointmentActionModal({ appointment, me, onClose, onSuccess }: AppointmentModalProps) {
  const [type, setType] = useState<'reschedule' | 'cancel' | null>(null);
  const [newStart, setNewStart] = useState(appointment.startAt.slice(0, 16));
  const [newEnd, setNewEnd] = useState(appointment.endAt.slice(0, 16));
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const isStudent = me.id === appointment.student.id;

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/classrooms/${appointment.classroomId}/requests`, {
        requestedTeacherId: appointment.teacher.id,
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

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
        {done ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-bold">요청이 전송되었습니다</p>
            <p className="text-sm text-gray-500">선생님이 확인 후 처리해드립니다.</p>
            <button onClick={onClose} className="bg-primary-600 text-white px-6 py-2 rounded-lg">
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">수업 요청</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-medium">클래스룸:</span> {appointment.classroom.name}</p>
              <p><span className="font-medium">선생님:</span> {appointment.teacher.name}</p>
              <p><span className="font-medium">현재 시작:</span> {fmt(appointment.startAt)}</p>
              <p><span className="font-medium">현재 종료:</span> {fmt(appointment.endAt)}</p>
            </div>

            {!type ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">어떤 요청을 하시겠습니까?</p>
                <button
                  onClick={() => setType('reschedule')}
                  className="w-full border-2 border-blue-200 rounded-xl p-3 text-left hover:bg-blue-50 transition"
                >
                  <p className="font-semibold text-blue-700">🕐 시간 변경 요청</p>
                  <p className="text-xs text-gray-500 mt-0.5">다른 시간으로 변경을 요청합니다</p>
                </button>
                <button
                  onClick={() => setType('cancel')}
                  className="w-full border-2 border-red-200 rounded-xl p-3 text-left hover:bg-red-50 transition"
                >
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
                    placeholder="변경 이유를 적어주세요 (선택)" rows={2}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setType(null)} className="flex-1 border rounded-lg py-2 text-sm">뒤로</button>
                  <button onClick={() => submitMutation.mutate()}
                    disabled={!newStart || !newEnd || submitMutation.isPending}
                    className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                    {submitMutation.isPending ? '전송 중...' : '변경 요청 보내기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">정말로 이 수업을 취소 요청하시겠습니까?</p>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="취소 이유를 적어주세요 (선택)" rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => setType(null)} className="flex-1 border rounded-lg py-2 text-sm">뒤로</button>
                  <button onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                    {submitMutation.isPending ? '전송 중...' : '취소 요청 보내기'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MySchedulePage({ params: { locale } }: { params: { locale: string } }) {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ id: string; name: string; role: string }>('/auth/me'),
  });

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['my-calendar', year, month],
    queryFn: () => api.get<CalendarData>(`/calendar/my?from=${from}&to=${to}`),
  });

  const days = getMonthDays(year, month);
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const apptByDay = new Map<number, AppointmentItem[]>();
  data?.appointments.forEach((a) => {
    const d = new Date(a.startAt).getDate();
    if (!apptByDay.has(d)) apptByDay.set(d, []);
    apptByDay.get(d)!.push(a);
  });

  const pendingByDay = new Map<number, PendingRequestItem[]>();
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

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <NavHeader locale={locale} title="내 일정" showBack backHref={`/${locale}/dashboard`} role={me?.role} />

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📅 내 일정</h1>
          <div className="text-sm text-gray-500">
            {me?.name}님의 수락된 수업 일정
          </div>
        </div>

        {/* 월 네비게이션 */}
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100">◀</button>
          <span className="font-semibold text-lg">{year}년 {monthNames[month]}</span>
          <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100">▶</button>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['일','월','화','수','목','금','토'].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-gray-500">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const appts = day ? (apptByDay.get(day) ?? []) : [];
              const pending = day ? (pendingByDay.get(day) ?? []) : [];
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();
              return (
                <div
                  key={idx}
                  className="min-h-[90px] p-1.5 border-b border-r last:border-r-0"
                >
                  {day && (
                    <>
                      <span
                        className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
                          isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {appts.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAppt(a)}
                            className="w-full text-left text-xs bg-primary-100 text-primary-800 rounded px-1 py-0.5 hover:bg-primary-200 transition truncate"
                            title={`${a.classroom.name} ${fmtTime(a.startAt)}~${fmtTime(a.endAt)}`}
                          >
                            {fmtTime(a.startAt)}~{fmtTime(a.endAt)}
                          </button>
                        ))}
                        {pending.map((r) => (
                          <div
                            key={r.id}
                            className={`text-xs rounded px-1 py-0.5 truncate ${
                              r.requestType === 'cancel' ? 'bg-red-100 text-red-700' :
                              r.requestType === 'reschedule' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                            title={`요청중 ${fmtTime(r.startAt)}`}
                          >
                            요청중 {fmtTime(r.startAt)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isLoading && <p className="text-gray-500 text-center">불러오는 중...</p>}

        {/* 이번 달 수업 목록 */}
        {data && data.appointments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{monthNames[month]} 수업 목록</h2>
            {data.appointments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAppt(a)}
                className="w-full bg-white border rounded-xl p-4 hover:shadow-md transition text-left space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{a.classroom.name}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">수락됨</span>
                </div>
                <div className="text-sm text-gray-600">
                  🕐 {new Date(a.startAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {' ~ '}
                  {new Date(a.endAt).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-400">선생님: {a.teacher.name} · 클릭하여 수정/취소 요청</div>
              </button>
            ))}
          </div>
        )}

        {data && data.appointments.length === 0 && !isLoading && (
          <div className="bg-white border rounded-xl p-10 text-center text-gray-400">
            <p className="text-lg">이번 달 수업이 없습니다.</p>
          </div>
        )}
      </main>

      {selectedAppt && me && (
        <AppointmentActionModal
          appointment={selectedAppt}
          me={me}
          classroomId={selectedAppt.classroomId}
          onClose={() => setSelectedAppt(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['my-calendar'] });
            setSelectedAppt(null);
          }}
        />
      )}
    </>
  );
}
