'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loading } from '@/components/ui';

export default function Home() {
  const { ready, user, academy } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (user.role === 'MASTER' && !academy) router.replace('/master');
    else router.replace('/painel');
  }, [ready, user, academy, router]);

  return <Loading />;
}
