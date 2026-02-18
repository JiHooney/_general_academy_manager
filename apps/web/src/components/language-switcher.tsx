'use client';

import { useRouter, usePathname } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@gam/shared';

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const langLabels: Record<string, string> = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    'zh-Hant': '繁體中文',
    'zh-Hans': '简体中文',
    fr: 'Français',
  };

  const handleChange = (locale: string) => {
    // Replace locale prefix in path
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
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
          {langLabels[l] ?? l}
        </option>
      ))}
    </select>
  );
}
