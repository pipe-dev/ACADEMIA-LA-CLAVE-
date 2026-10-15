import React from 'react';
import { EscalasModal } from '../EscalasModal';
import { BreathingModal } from '../BreathingModal';
import { StabilityChallengeModal } from '../StabilityChallengeModal';
import { DueloRapidoModal } from '../DueloRapidoModal';
import { VocalRangeModal } from '../VocalRangeModal';
import { VoiceEvalModal } from '../VoiceEvalModal';
import { TunerSubView } from './afinadorTypes';

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
        <BreathingModal isEmbeddedView={true} onClose={onClose} />
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
