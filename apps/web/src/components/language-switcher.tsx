'use client';

import { usePathname } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@gam/shared';
import { api } from '../lib/api';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  fr: 'Français',
};

function setLocaleCookie(locale: string) {
  // next-intl reads NEXT_LOCALE cookie for preference detection
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LanguageSwitcher({
  currentLocale,
  /** If true, syncs locale change to the server via PATCH /auth/me */
  isLoggedIn = false,
}: {
  currentLocale: string;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();

  const handleChange = async (locale: string) => {
    // 1. Persist to cookie (for middleware) and localStorage
    setLocaleCookie(locale);
    try { localStorage.setItem('NEXT_LOCALE', locale); } catch (_) {}

    // 2. Sync to server profile when logged in
    if (isLoggedIn) {
      try { await api.patch('/auth/me', { locale }); } catch (_) {}
    }

    // 3. Full-page navigation so server components reload with new messages
    const segments = pathname.split('/');
    segments[1] = locale;
    window.location.href = segments.join('/');
  };

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleChange(e.target.value)}
      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
      aria-label="Language"
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>
          {LANG_LABELS[l] ?? l}
        </option>
      ))}
    </select>
  );
}
