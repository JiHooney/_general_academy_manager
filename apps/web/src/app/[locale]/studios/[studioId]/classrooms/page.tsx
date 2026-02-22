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
    queryFn: () => api.get<{ role: string; timezone?: string }>('/auth/me'),
  });
  const isTeacher = me?.role === 'teacher' || me?.role === 'admin';

  // 사용자 timezone으로 기본값 자동 설정
  useEffect(() => {
    if (me?.timezone) setTimezone(me.timezone);
  }, [me?.timezone]);

  const generateInviteMutation = useMutation({
    mutationFn: () => api.post<{ code: string }>(`/studios/${studioId}/invites`, {}),
    onSuccess: (data) => setInviteCode(data.code),
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
      <NavHeader locale={locale} title="클래스룸" showBack backHref={`/${locale}/studios`} />

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
              🔑 초대코드 생성
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
            <p className="text-xs text-amber-600 font-semibold mb-1">📨 학생에게 이 코드를 공유하세요</p>
            <p className="font-mono text-2xl font-bold text-amber-800 tracking-widest">{inviteCode}</p>
          </div>
          <button
            onClick={copyCode}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition text-sm font-medium whitespace-nowrap"
          >
            {copied ? '✅ 복사됨' : '📋 복사'}
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
    </main>
    </>
  );
}
