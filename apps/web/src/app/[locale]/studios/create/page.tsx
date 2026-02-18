'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { NavHeader } from '../../../../components/nav-header';

export default function StudioCreatePage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/organizations'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/studios', { name, organizationId: orgId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studios'] });
      router.push(`/${locale}/studios`);
    },
  });

  return (
    <>
      <NavHeader locale={locale} title="스튜디오 생성" showBack backHref={`/${locale}/studios`} />

      <main className="max-w-lg mx-auto p-6">
        <div className="bg-white border rounded-xl p-6 space-y-5 shadow-sm">
          <h1 className="text-xl font-bold">스튜디오 생성</h1>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">스튜디오 이름</label>
            <input
              placeholder="예) 영어 스튜디오"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">조직 선택</label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">조직 선택...</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {createMutation.isError && (
            <p className="text-red-500 text-sm">{(createMutation.error as any)?.message}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name || !orgId || createMutation.isPending}
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
            >
              {createMutation.isPending ? '생성 중...' : '생성하기'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
