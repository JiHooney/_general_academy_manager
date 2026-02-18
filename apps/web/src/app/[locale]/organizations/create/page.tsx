'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { NavHeader } from '../../../../components/nav-header';

export default function OrganizationCreatePage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => api.post('/organizations', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      router.push(`/${locale}/studios/create`);
    },
    onError: (err: any) => setError(err.message || '조직 생성에 실패했습니다.'),
  });

  return (
    <>
      <NavHeader locale={locale} title="조직 생성" showBack backHref={`/${locale}/dashboard`} />

      <main className="max-w-lg mx-auto p-6">
        <div className="bg-white border rounded-xl p-6 space-y-5 shadow-sm">
          <div>
            <h1 className="text-xl font-bold">조직 생성</h1>
            <p className="text-sm text-gray-500 mt-1">
              조직은 스튜디오를 묶는 단위입니다. 선생님만 생성할 수 있습니다.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">조직 이름</label>
            <input
              placeholder="예) ABC 어학원"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
            >
              {createMutation.isPending ? '생성 중...' : '조직 생성하기'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            생성 후 스튜디오 생성 페이지로 이동합니다.
          </p>
        </div>
      </main>
    </>
  );
}
