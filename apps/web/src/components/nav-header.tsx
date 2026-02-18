'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';

interface NavHeaderProps {
  locale: string;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  /** 현재 로그인 유저 역할 (teacher 여부 확인 용) */
  role?: string;
}

export function NavHeader({ locale, title, showBack, backHref, role }: NavHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const home = `/${locale}/dashboard`;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (_) {}
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
                ← 뒤로
              </Link>
            )}
            <Link href={home} className="text-primary-700 font-bold text-lg">
              GAM
            </Link>
            {title && <span className="text-gray-400 mx-1">/</span>}
            {title && <span className="text-gray-700 font-medium text-sm">{title}</span>}
          </div>

          {/* 오른쪽: 홈 버튼 + 메뉴 */}
          <div className="flex items-center gap-2">
            <Link
              href={home}
              className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              🏠 홈
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
            >
              ☰ 메뉴
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
            <p className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">메뉴</p>

            <Link
              href={home}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🏠 홈 (대시보드)
            </Link>

            <Link
              href={`/${locale}/studios`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🏫 스튜디오 목록
            </Link>

            <Link
              href={`/${locale}/studios/create`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              ➕ 스튜디오 생성
            </Link>

            <Link
              href={`/${locale}/studios/join`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
            >
              🔑 스튜디오 참가
            </Link>

            {/* 선생님 전용 */}
            {role === 'teacher' || role === 'admin' ? (
              <Link
                href={`/${locale}/requests`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-amber-600 font-medium"
              >
                📋 수업 요청 관리
              </Link>
            ) : null}

            <div className="border-t my-1" />

            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500"
            >
              🚪 로그아웃
            </button>
          </div>
        </>
      )}
    </>
  );
}
