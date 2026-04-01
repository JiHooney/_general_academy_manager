'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import type { Classroom } from '@gam/shared';
import { NavHeader } from '../../../../../components/nav-header';

const COMMON_TIMEZONES = [
  'Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Taipei', 'Asia/Hong_Kong',
  'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo', 'America/Mexico_City',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

interface Me { id: string; role: string; timezone?: string; }
interface StudioMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}
interface Studio { id: string; name: string; createdBy: string; }

// 스튜디오 초대코드 생성 버튼 (inlne component)
function StudioInviteButton({ studioId }: { studioId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => api.post<{ code: string }>(`/studios/${studioId}/invites`, {}),
    onSuccess: (data) => { setCode(data.code); setShow(true); },
  });

  const copy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="border border-green-500 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition text-sm font-medium disabled:opacity-50"
      >
        🔗 스튜디오 초대코드
      </button>
      {show && code && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-3 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">스튜디오 초대코드</h3>
            <p className="text-xs text-gray-500">학생에게 이 코드를 공유하여 스튜디오에 초대하세요.</p>
            <p className="font-mono text-3xl font-bold text-center text-green-700 tracking-widest bg-green-50 rounded-xl py-4">{code}</p>
            <div className="flex gap-2">
              <button onClick={copy} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">
                {copied ? '✅ 복사됨' : '📋 코드 복사'}
              </button>
              <button onClick={() => setShow(false)} className="flex-1 border py-2 rounded-lg text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface Props {
  params: { locale: string; studioId: string };
}

export default function ClassroomsPage({ params: { locale, studioId } }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/auth/me'),
  });

  const { data: studio } = useQuery({
    queryKey: ['studio', studioId],
    queryFn: () => api.get<Studio>(`/studios/${studioId}`),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['studio-members', studioId],
    queryFn: () => api.get<StudioMember[]>(`/studios/${studioId}/members`),
  });

  // 현재 유저의 스튜디오 멤버십 역할로 isTeacher 결정
  const myMembership = members.find((m) => m.userId === me?.id);
  const isTeacher = myMembership?.role === 'teacher' || me?.role === 'admin';
  const isCreator = studio?.createdBy === me?.id || me?.role === 'admin';

  const userTimezone = me?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // 사용자 timezone으로 기본값 자동 설정
  useEffect(() => {
    setTimezone(userTimezone);
  }, [userTimezone]);

  // 폼 열 때마다 사용자 timezone으로 초기화
  useEffect(() => {
    if (showForm) setTimezone(userTimezone);
  }, [showForm]);

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/studios/${studioId}/members/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-members', studioId] }),
  });

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ['classrooms', studioId],
    queryFn: () => api.get<Classroom[]>(`/classrooms?studioId=${studioId}`),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/studios/${studioId}/classrooms`, { name, description, timezone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classrooms', studioId] });
      setShowForm(false);
      setName('');
      setDescription('');
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description: string }) =>
      api.patch(`/classrooms/${id}`, { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classrooms', studioId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classrooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classrooms', studioId] }),
  });

  return (
    <>
      <NavHeader locale={locale} title={t('classroom.title')} showBack backHref={`/${locale}/studios`} />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('classroom.title')}</h1>
        <div className="flex items-center gap-2">
          {isCreator && (
            <StudioInviteButton studioId={studioId} />
          )}
          {isTeacher && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
          >
            {t('classroom.create')}
          </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold">{t('classroom.create')}</h2>          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            💡 클래스룸을 만든 후 클래스룸 내부에서 <strong>클래스룸 초대코드</strong>를 생성하여 학생에게 공유하세요.
          </div>          <input
            placeholder={t('classroom.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            placeholder={t('classroom.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-white"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {t('common.save')}
            </button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : classrooms.length === 0 ? (
        <p className="text-gray-500">{t('classroom.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {classrooms.map((c) => {
            const canManage = c.createdBy === me?.id || isCreator;
            return (
              <li key={c.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {editingId === c.id ? (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">클래스명</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="클래스명을 입력하세요"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">클래스 설명</label>
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="클래스 설명을 입력하세요 (선택사항)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => renameMutation.mutate({ id: c.id, name: editName, description: editDescription })}
                        disabled={!editName || renameMutation.isPending}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="border px-3 py-1.5 rounded-lg text-xs text-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Link
                      href={`/${locale}/classrooms/${c.id}/calendar?studioId=${studioId}`}
                      className="flex-1 block p-4 hover:bg-gray-50 transition"
                    >
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.description}</p>
                      {(c as any).creator && (
                        <p className="text-xs text-gray-400 mt-0.5">👤 {(c as any).creator.name}</p>
                      )}
                      <p className="text-xs text-gray-400">{c.timezone}</p>
                    </Link>
                    {canManage && (
                      <div className="flex items-center gap-1 pr-3">
                        <button
                          onClick={() => { setEditingId(c.id); setEditName(c.name); setEditDescription(c.description || ''); }}
                          className="text-xs border px-2 py-1 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => { if (confirm(`"${c.name}" 클래스룸을 삭제할까요?`)) deleteMutation.mutate(c.id); }}
                          disabled={deleteMutation.isPending}
                          className="text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 transition disabled:opacity-50"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ─── 멤버 관리 ─────────────────────────────────── */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">👥 {t('studio.members')}</h2>
        {membersLoading ? (
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        ) : (
          <ul className="divide-y">
            {(isTeacher ? members : members.filter((m) => m.role === 'teacher')).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-gray-800">
                    {m.user.name}
                    {m.userId === me?.id && (
                      <span className="ml-1 text-xs text-gray-400">{t('studio.you')}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.role === 'teacher'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.role === 'teacher' ? t('studio.teacherBadge') : t('studio.studentBadge')}
                  </span>
                  {isCreator && m.userId !== me?.id && (
                    <button
                      onClick={() => setRoleMutation.mutate({
                        userId: m.userId,
                        role: m.role === 'teacher' ? 'student' : 'teacher',
                      })}
                      disabled={setRoleMutation.isPending}
                      className="text-xs border px-2 py-1 rounded-lg hover:bg-gray-50 transition text-gray-600 disabled:opacity-50"
                    >
                      {m.role === 'teacher' ? t('studio.setStudent') : t('studio.setTeacher')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
    </>
  );
}