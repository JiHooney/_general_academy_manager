'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';
import { NavHeader } from '../../../components/nav-header';

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Me>('/auth/me')
      .then(setMe)
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        ...
      </div>
    );
  }

  if (!me) return null;

  return (
    <>
      <NavHeader locale={locale} title={t('title')} />

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 인사말 */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">{t('greeting')}</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{me.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{me.email}</p>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/studios`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">🏫</span>
            <span className="font-semibold text-gray-800">{t('studios')}</span>
            <span className="text-xs text-gray-400">{t('studiosDesc')}</span>
          </Link>

          <Link
            href={`/${locale}/studios/create`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">➕</span>
            <span className="font-semibold text-gray-800">{t('createStudio')}</span>
            <span className="text-xs text-gray-400">{t('createStudioDesc')}</span>
          </Link>

          <Link
            href={`/${locale}/studios/join`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">🔑</span>
            <span className="font-semibold text-gray-800">{t('joinStudio')}</span>
            <span className="text-xs text-gray-400">{t('joinStudioDesc')}</span>
          </Link>

          <Link
            href={`/${locale}/requests`}
            className="bg-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">📋</span>
            <span className="font-semibold text-amber-700">{t('requestsTitle')}</span>
            <span className="text-xs text-amber-500">{t('requestsDesc')}</span>
          </Link>
        </div>
      </main>
    </>
  );
}
