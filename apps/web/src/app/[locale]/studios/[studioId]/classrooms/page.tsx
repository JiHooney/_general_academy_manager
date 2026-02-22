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

interface Props {
  params: { locale: string; studioId: string };
}

export default function ClassroomsPage({ params: { locale, studioId } }: Props) {
  const t = useTranslations();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // 사용자 timezone으로 기본값 자동 설정
  useEffect(() => {
    if (me?.timezone) setTimezone(me.timezone);
  }, [me?.timezone]);

  const generateInviteMutation = useMutation({
    mutationFn: () => api.post<{ code: string }>(`/studios/${studioId}/invites`, {}),
    onSuccess: (data) => setInviteCode(data.code),
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/studios/${studioId}/members/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studio-members', studioId] }),
  });

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  return (
    <>
      <NavHeader locale={locale} title={t('classroom.title')} showBack backHref={`/${locale}/studios`} />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('classroom.title')}</h1>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <button
              onClick={() => generateInviteMutation.mutate()}
              disabled={generateInviteMutation.isPending}
              className="border border-amber-500 text-amber-600 px-4 py-2 rounded-lg hover:bg-amber-50 transition text-sm font-medium"
            >
              🔑 {t('invite.create')}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
          >
            {t('classroom.create')}
          </button>
        </div>
      </div>

      {/* 초대코드 표시 배너 */}
      {inviteCode && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-amber-600 font-semibold mb-1">📨 {t('invite.code')}</p>
            <p className="font-mono text-2xl font-bold text-amber-800 tracking-widest">{inviteCode}</p>
          </div>
          <button
            onClick={copyCode}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition text-sm font-medium whitespace-nowrap"
          >
            {copied ? '✅' : '📋'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold">{t('classroom.create')}</h2>
          <input
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
          {classrooms.map((c) => (
            <li key={c.id}>
              <Link
                href={`/${locale}/classrooms/${c.id}/calendar`}
                className="block bg-white border rounded-xl p-4 hover:shadow-md transition"
              >
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-500">{c.description}</p>
                <p className="text-xs text-gray-400">{c.timezone}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ─── 멤버 관리 ─────────────────────────────────── */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">👥 {t('studio.members')}</h2>
        {membersLoading ? (
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
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