'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import type { Classroom } from '@gam/shared';
import { NavHeader } from '../../../../../components/nav-header';

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
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
        >
          {t('classroom.create')}
        </button>
      </div>

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
          <input
            placeholder={t('classroom.timezone')}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
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
