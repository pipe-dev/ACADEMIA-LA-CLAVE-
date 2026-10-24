import React from 'react';
import dynamic from 'next/dynamic';
import { TunerSubView } from './afinadorTypes';

const EscalasModal = dynamic(() => import('../EscalasModal').then((m) => m.EscalasModal), { ssr: false });
const BreathingModal = dynamic(() => import('../BreathingModal').then((m) => m.BreathingModal), { ssr: false });
const StabilityChallengeModal = dynamic(() => import('../StabilityChallengeModal').then((m) => m.StabilityChallengeModal), { ssr: false });
const DueloRapidoModal = dynamic(() => import('../DueloRapidoModal').then((m) => m.DueloRapidoModal), { ssr: false });
const VocalRangeModal = dynamic(() => import('../VocalRangeModal').then((m) => m.VocalRangeModal), { ssr: false });
const VoiceEvalModal = dynamic(() => import('../VoiceEvalModal').then((m) => m.VoiceEvalModal), { ssr: false });

interface TunerSubViewsOrchestratorProps {
  activeSubView: TunerSubView;
  onClose: () => void;
  onGrantXp: (amount: number) => void;
  onSaveVocalRange: (rangeData: any) => void;
}

export const TunerSubViewsOrchestrator: React.FC<TunerSubViewsOrchestratorProps> = ({
  activeSubView,
  onClose,
  onGrantXp,
  onSaveVocalRange
}) => {
  if (!activeSubView) return null;

  if (activeSubView === 'escalas') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <EscalasModal isEmbeddedView={true} onClose={onClose} />
      </div>
    );
  }

  if (activeSubView === 'respiracion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <BreathingModal isEmbeddedView={true} onClose={onClose} onGrantXp={onGrantXp} />
      </div>
    );
  }

  if (activeSubView === 'estabilidad') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <StabilityChallengeModal
          isEmbeddedView={true}
          onClose={onClose}
          onGrantXp={onGrantXp}
        />
      </div>
    );
  }

  if (activeSubView === 'duelo') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <DueloRapidoModal isEmbeddedView={true} onClose={onClose} />
      </div>
    );
  }

  if (activeSubView === 'tesitura') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VocalRangeModal
          isEmbeddedView={true}
          onClose={onClose}
          onSaveRange={onSaveVocalRange}
        />
      </div>
    );
  }

  if (activeSubView === 'evaluacion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VoiceEvalModal isEmbeddedView={true} onClose={onClose} />
      </div>
    );
  }

  return null;
};
