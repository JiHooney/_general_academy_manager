'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';
import { LanguageSwitcher } from '../../../components/language-switcher';

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/login', { email, password });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || t('unauthorized'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">GAM</h1>
          <LanguageSwitcher currentLocale={locale} />
        </div>
        <p className="text-gray-500 text-sm -mt-3">General Academic Manager</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? '...' : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {t('noAccount')}{' '}
          <a href={`/${locale}/signup`} className="text-primary-600 hover:underline">
            {t('signup')}
          </a>
        </p>
      </div>
    </main>
  );
}
