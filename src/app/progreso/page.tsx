'use client';

import { ProgressDashboard } from '@/components/progress-dashboard';
import { useVocalContext } from '@/components/vocal-provider';
import { useRouter } from 'next/navigation';

export default function ProgresoPage() {
  const { vocalRangeKey } = useVocalContext();
  const router = useRouter();

  if (!vocalRangeKey) return null;

  return (
    <ProgressDashboard 
      vocalRangeKey={vocalRangeKey} 
      onClose={() => router.push('/clases')} 
    />
  );
}
