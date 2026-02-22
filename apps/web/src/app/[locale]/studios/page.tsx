'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { NavHeader } from '../../../components/nav-header';
import type { Studio } from '@gam/shared';

export default function StudiosPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();

  const { data: studios = [], isLoading } = useQuery({
    queryKey: ['studios'],
    queryFn: () => api.get<Studio[]>('/studios'),
  });

  return (
    <>
      <NavHeader locale={locale} title="스튜디오 목록" showBack backHref={`/${locale}/dashboard`} />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">스튜디오 목록</h1>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/studios/join`}
              className="border border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition text-sm"
            >
              🔑 참가
            </Link>
            <Link
              href={`/${locale}/studios/create`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
            >
              ➕ 생성
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-500">{t('common.loading')}</p>
        ) : studios.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center text-gray-400 space-y-3">
            <p className="text-lg">아직 스튜디오가 없습니다.</p>
            <p className="text-sm">스튜디오를 생성하거나 초대 코드로 참가하세요.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href={`/${locale}/studios/create`} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition">
                스튜디오 생성
              </Link>
              <Link href={`/${locale}/studios/join`} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                초대 코드로 참가
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {studios.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${locale}/studios/${s.id}/classrooms`}
                  className="block bg-white border rounded-xl p-4 hover:shadow-md transition"
                >
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-gray-500">ID: {s.id}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
