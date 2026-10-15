import React from 'react';
import { Mic } from 'lucide-react';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

interface VoiceEvalRecordingStateProps {
  recordingSeconds: number;
  selectedTargetNoteName: string;
  livePitch: number | null;
}

export const VoiceEvalRecordingState: React.FC<VoiceEvalRecordingStateProps> = ({
  recordingSeconds,
  selectedTargetNoteName,
  livePitch,
}) => {
  return (
    <div className="py-4 text-center space-y-4">
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center border-4 border-red-400 dark:border-red-700 shadow-xl relative z-10">
          <Mic className="w-8 h-8" />
        </div>
        <span className="absolute -bottom-1 bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md z-20">
          {recordingSeconds}s
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-100">
          Cantando: <span className="text-indigo-600 dark:text-indigo-400">{selectedTargetNoteName}</span>
        </h4>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {livePitch
            ? 'Capturando tono vocal...'
            : 'Sostén la nota con aire fluido...'}
        </p>
      </div>

      {/* Real-time soundwave visualization canvas */}
      <AudioWaveformVisualizer />
    </div>
  );
};
