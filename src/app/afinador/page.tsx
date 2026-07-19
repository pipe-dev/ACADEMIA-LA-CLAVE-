'use client';

import { Tuner } from '@/components/tuner';
import { useVocalContext } from '@/components/vocal-provider';

export default function AfinadorPage() {
  const { notePool, gender, vocalRangeKey, handleResetRange, setShowVocalAssessor } = useVocalContext();

  if (!notePool || !gender) return null;

  return (
    <Tuner 
      notePool={notePool} 
      gender={gender} 
      vocalRangeKey={vocalRangeKey} 
      onGoBack={handleResetRange} 
      onOpenVocalAssessor={() => setShowVocalAssessor(true)} 
    />
  );
}
