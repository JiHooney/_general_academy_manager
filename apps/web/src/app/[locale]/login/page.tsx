'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from '../../../components/language-switcher';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [findEmailMode, setFindEmailMode] = useState(false);
  const [findName, setFindName] = useState('');
  const [findResults, setFindResults] = useState<string[] | null>(null);
  const [findLoading, setFindLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<'sent' | 'notfound' | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [signupSuccessBanner, setSignupSuccessBanner] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preEmail = params.get('email');
    if (preEmail) {
      setEmail(preEmail);
      setSignupSuccessBanner(preEmail);
    }
  }, []);

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findName.trim()) return;
    setFindLoading(true);
    setFindResults(null);
    try {
      const res = await fetch(`${API_BASE}/auth/find-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: findName.trim() }),
      });
      const data = await res.json();
      setFindResults(data.emails ?? []);
    } catch {
      setFindResults([]);
    } finally {
      setFindLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotResult(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotResult(data.sent ? 'sent' : 'notfound');
    } catch {
      setForgotResult('notfound');
    } finally {
      setForgotLoading(false);
    }
  };

  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'google_auth_failed') return t('googleAuthFailed');
    return '';
  });

  const handleGoogleLogin = () => {
    const url = `${API_BASE}/auth/google/start?locale=${locale}&platform=web`;
    window.location.href = url;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Login failed');
      }

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message);
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

        {signupSuccessBanner && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-green-700">{t('signupComplete')}</p>
            <p className="text-xs text-green-600">{t('signupCompleteLoginMsg')}</p>
            <p className="text-sm font-mono font-medium text-green-800">{signupSuccessBanner}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition font-medium text-gray-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('googleLogin')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-gray-300" />
          <span className="text-sm text-gray-400">{t('orDivider')}</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Email Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? '...' : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/signup`} className="text-blue-600 hover:underline">
            {t('signup')}
          </Link>
        </p>

        {/* 아이디 찾기 / 비밀번호 찾기 */}
        <div className="flex justify-center gap-4 text-sm text-gray-400">
          <button
            type="button"
            onClick={() => { setFindEmailMode(true); setForgotPasswordMode(false); setFindResults(null); setFindName(''); }}
            className="hover:text-gray-600 underline underline-offset-2 transition"
          >
            {t('findEmail')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => { setForgotPasswordMode(!forgotPasswordMode); setFindEmailMode(false); setForgotResult(null); setForgotEmail(''); }}
            className="hover:text-gray-600 underline underline-offset-2 transition"
          >
            {t('forgotPassword')}
          </button>
        </div>

        {findEmailMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">아이디(이메일) 찾기</h3>
                <button onClick={() => { setFindEmailMode(false); setFindResults(null); setFindName(''); }}
                  className="text-gray-400 hover:text-gray-700 text-xl">×</button>
              </div>
              <p className="text-xs text-gray-500">가입 시 사용한 이메일을 입력하면 계정 등록 여부를 확인해 드립니다.</p>
              <form onSubmit={handleFindEmail} className="flex gap-2">
                <input
                  type="email"
                  placeholder="이메일 입력"
                  value={findName}
                  onChange={(e) => { setFindName(e.target.value); setFindResults(null); }}
                  required
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={findLoading}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {findLoading ? '...' : '찾기'}
                </button>
              </form>
              {findResults !== null && (
                findResults.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
                    <p className="text-xs text-green-600">가입된 계정이 확인되었습니다.</p>
                    <p className="text-sm font-mono font-semibold text-green-800">{findName}</p>
                    <button
                      onClick={() => { setEmail(findName); setFindEmailMode(false); setFindResults(null); setFindName(''); }}
                      className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      이 이메일로 로그인하기
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-red-600">등록된 계정을 찾을 수 없습니다.</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {forgotPasswordMode && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">{t('forgotPasswordTitle')}</p>
            <p className="text-xs text-gray-400">{t('forgotPasswordDesc')}</p>
            <form onSubmit={handleForgotPassword} className="flex gap-2">
              <input
                type="email"
                placeholder={t('email')}
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); setForgotResult(null); }}
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {forgotLoading ? '...' : t('forgotPasswordSubmit')}
              </button>
            </form>
            {forgotResult === 'sent' && (
              <p className="text-xs text-green-600">✓ {t('forgotPasswordSent')}</p>
            )}
            {forgotResult === 'notfound' && (
              <p className="text-xs text-red-500">✗ {t('forgotPasswordNotFound')}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
