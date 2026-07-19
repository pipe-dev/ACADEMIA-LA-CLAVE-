'use client';

import { AcademyCourse } from '@/components/academy-course';
import { useVocalContext } from '@/components/vocal-provider';

export default function ClasesPage() {
  const { notePool, gender, vocalRangeKey, handleResetRange } = useVocalContext();

  if (!notePool || !gender) return null;

  return (
    <AcademyCourse 
      onGoBack={handleResetRange} 
      notePool={notePool}
      gender={gender}
      vocalRangeKey={vocalRangeKey}
    />
  );
}
