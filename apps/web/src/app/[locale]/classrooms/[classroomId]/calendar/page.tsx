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

export default function CalendarPage({ params: { classroomId, locale } }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<ViewMode>('month');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

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

  return (
    <>
      <NavHeader locale={locale} title="캘린더" showBack backHref={`/${locale}/studios`} />

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
                          <div
                            key={a.id}
                            className="text-xs bg-primary-100 text-primary-700 rounded px-1 truncate"
                            title={`${new Date(a.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            {new Date(a.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ))}
                        {pending.slice(0, 2).map((r) => (
                          <div
                            key={r.id}
                            className="text-xs bg-yellow-100 text-yellow-700 rounded px-1 truncate cursor-pointer hover:bg-yellow-200 transition"
                            title={`요청중 ${new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            onClick={() => setSelectedRequest(r)}
                          >
                            요청중 {new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </main>
    </>
  );
}
