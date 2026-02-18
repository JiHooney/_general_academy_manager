'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { NavHeader } from '../../../components/nav-header';

interface PendingRequest {
  id: string;
  startAt: string;
  endAt: string;
  message?: string;
  status: string;
  requestType?: string;
  appointment?: { id: string; startAt: string; endAt: string } | null;
  student: { id: string; name: string; email: string };
  classroom: { id: string; name: string };
}

export default function PendingRequestsPage({ params: { locale } }: { params: { locale: string } }) {
  const qc = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => api.get<PendingRequest[]>('/requests/pending'),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/requests/${id}/accept`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/requests/${id}/reject`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-requests'] }),
  });

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <>
      <NavHeader locale={locale} title="수업 요청 관리" showBack backHref={`/${locale}/dashboard`} />

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">수업 요청 관리</h1>
        <button
          onClick={() => refetch()}
          className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>

      {isLoading && <p className="text-gray-500">불러오는 중...</p>}

      {!isLoading && requests.length === 0 && (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
          대기 중인 수업 요청이 없습니다.
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => {
          const typeLabel =
            req.requestType === 'cancel' ? { label: '취소 요청', cls: 'bg-red-100 text-red-700' } :
            req.requestType === 'reschedule' ? { label: '시간 변경 요청', cls: 'bg-blue-100 text-blue-700' } :
            { label: '신규 수업 요청', cls: 'bg-yellow-100 text-yellow-700' };

          return (
          <div key={req.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{req.classroom.name}</p>
                <p className="text-sm text-gray-500">학생: {req.student.name} ({req.student.email})</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeLabel.cls}`}>{typeLabel.label}</span>
            </div>

            {req.appointment && req.requestType !== 'new' && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-700">현재 예약된 수업</p>
                <p>시작: {fmt(req.appointment.startAt)}</p>
                <p>종료: {fmt(req.appointment.endAt)}</p>
              </div>
            )}

            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">{req.requestType === 'cancel' ? '취소할' : req.requestType === 'reschedule' ? '변경 후' : ''} 시작</span>
                <span>{fmt(req.startAt)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">종료</span>
                <span>{fmt(req.endAt)}</span>
              </div>
              {req.message && (
                <div className="flex gap-2">
                  <span className="font-medium w-20 shrink-0">메시지</span>
                  <span className="text-gray-600 italic">"{req.message}"</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => acceptMutation.mutate(req.id)}
                disabled={acceptMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
              >
                {acceptMutation.isPending ? '처리 중...' : '✓ 수락'}
              </button>
              <button
                onClick={() => rejectMutation.mutate(req.id)}
                disabled={rejectMutation.isPending}
                className="flex-1 border border-red-300 text-red-500 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
              >
                {rejectMutation.isPending ? '처리 중...' : '✕ 거절'}
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </main>
    </>
  );
}
