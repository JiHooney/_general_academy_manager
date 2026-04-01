'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../lib/api';
import { LanguageSwitcher } from './language-switcher';

interface NavHeaderProps {
  locale: string;
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export function NavHeader({ locale, title, showBack, backHref }: NavHeaderProps) {
  const router = useRouter();
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const home = `/${locale}/dashboard`;

  useEffect(() => {
    api.get<{ role: string }>('/auth/me')
      .then((me) => setIsTeacher(me.role === 'teacher'))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (_) { /* ignore */ }
    router.push(`/${locale}/login`);
  };

  return (
    <>
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 왼쪽: 홈 또는 뒤로가기 */}
          <div className="flex items-center gap-2">
            {showBack && (
              <Link
                href={backHref ?? home}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← {t('back')}
              </Link>
            )}
            <Link href={home} className="text-primary-700 font-bold text-lg">
              GAM
            </Link>
            {title && <span className="text-gray-400 mx-1">/</span>}
            {title && <span className="text-gray-700 font-medium text-sm">{title}</span>}
          </div>

          {/* 오른쪽: 언어선택 + 홈 버튼 + 메뉴 */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} isLoggedIn={true} />
            <Link
              href={home}
              className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              🏠 {t('homeBtn')}
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
            >
              ☰ {t('menu')}
            </button>
          </div>
        </div>
      </header>

      {/* 드롭다운 메뉴 오버레이 */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-14 right-4 z-50 bg-white border rounded-xl shadow-lg w-56 py-2 overflow-hidden">
            <p className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">{t('menuTitle')}</p>

            <Link
              href={home}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🏠 {t('navHome')}
            </Link>

            <Link
              href={`/${locale}/studios`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🏫 {t('navStudios')}
            </Link>

            {isTeacher && (
            <Link
              href={`/${locale}/studios/create`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              ➕ {t('navCreateStudio')}
            </Link>
            )}

            <Link
              href={`/${locale}/studios/join`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🔑 {t('navJoinStudio')}
            </Link>

            <Link
              href={`/${locale}/schedule`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              📅 {t('navSchedule')}
            </Link>

            {isTeacher && (
            <Link
              href={`/${locale}/requests`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-amber-600 font-medium"
            >
              📋 {t('navRequests')}
            </Link>
            )}

            <div className="border-t my-1" />

            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500"
            >
              🚪 {t('logout')}
            </button>
          </div>
        </>
      )}
    </>
  );
}
