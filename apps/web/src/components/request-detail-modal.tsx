'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { BookingRequest } from '@gam/shared';

interface Props {
  request: BookingRequest;
  classroomId: string;
  onClose: () => void;
  viewerRole?: string;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RequestDetailModal({ request, classroomId, onClose, viewerRole }: Props) {
  const qc = useQueryClient();
  const isTeacher = viewerRole === 'teacher';
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view');
  const [startAt, setStartAt] = useState(toLocalInput(request.startAt as unknown as string));
  const [endAt, setEndAt] = useState(toLocalInput(request.endAt as unknown as string));
  const [message, setMessage] = useState(request.message ?? '');
  const [error, setError] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['calendar', classroomId] });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/requests/${request.id}`, {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        message,
      }),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e: any) => setError(e.message || '수정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.post(`/requests/${request.id}/cancel`, {}),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e: any) => setError(e.message || '삭제에 실패했습니다.'),
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/requests/${request.id}/accept`, {}),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e: any) => setError(e.message || '수락에 실패했습니다.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/requests/${request.id}/reject`, {}),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e: any) => setError(e.message || '거절에 실패했습니다.'),
  });

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {mode === 'edit' ? '수업 요청 수정' : mode === 'confirm-delete' ? '삭제 확인' : '요청 중인 수업'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        {/* 보기 모드 */}
        {mode === 'view' && (
          <>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">시작 시간</span>
                <span>{fmt(request.startAt as unknown as string)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">종료 시간</span>
                <span>{fmt(request.endAt as unknown as string)}</span>
              </div>
              {request.message && (
                <div className="flex gap-2">
                  <span className="font-medium w-20 shrink-0">메시지</span>
                  <span>{request.message}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">상태</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 rounded text-xs py-0.5">요청중</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {isTeacher ? (
                <>
                  <button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending || rejectMutation.isPending}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? '...' : '✅ 수락'}
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={acceptMutation.isPending || rejectMutation.isPending}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? '...' : '❌ 거절'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMode('edit')}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    변경
                  </button>
                  <button
                    onClick={() => setMode('confirm-delete')}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* 수정 모드 */}
        {mode === 'edit' && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">시작 시간</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => {
                    setStartAt(e.target.value);
                    if (endAt && e.target.value && endAt <= e.target.value) setEndAt('');
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">종료 시간</label>
                {!startAt && (
                  <p className="text-xs text-amber-600 mb-1">⚠ 시작 시간을 먼저 선택해주세요.</p>
                )}
                <input
                  type="datetime-local"
                  value={endAt}
                  min={startAt || undefined}
                  disabled={!startAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">메시지</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!startAt || !endAt || updateMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-primary-700"
              >
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setMode('view')} className="flex-1 border py-2 rounded-lg">
                취소
              </button>
            </div>
          </>
        )}

        {/* 삭제 확인 모드 */}
        {mode === 'confirm-delete' && (
          <>
            <p className="text-gray-700">정말 이 수업 요청을 삭제하시겠습니까?<br />삭제 후에는 복구할 수 없습니다.</p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? '삭제 중...' : '삭제 확인'}
              </button>
              <button onClick={() => setMode('view')} className="flex-1 border py-2 rounded-lg">
                취소
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
