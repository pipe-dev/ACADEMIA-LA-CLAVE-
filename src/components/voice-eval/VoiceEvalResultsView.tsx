import React from 'react';
import { ShieldCheck, Activity, History, TrendingUp, RefreshCw, Check, MicOff, AlertCircle } from 'lucide-react';
import { VoiceEvaluationResult } from '../../types';

interface VoiceEvalResultsViewProps {
  result: VoiceEvaluationResult;
  selectedTargetNoteName: string;
  onRetry: () => void;
  onClose: () => void;
}

export const VoiceEvalResultsView: React.FC<VoiceEvalResultsViewProps> = ({
  result,
  selectedTargetNoteName,
  onRetry,
  onClose,
}) => {
  if (result.insufficientAudio) {
    return (
      <div className="space-y-4 pt-1 animate-fadeIn">
        {/* Warning Badge Card */}
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/60 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
            <MicOff className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full inline-block">
              Señal Insuficiente
            </span>
            <h4 className="font-heading font-black text-lg text-slate-800 dark:text-slate-100">
              No pudimos capturar tu voz
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Durante los 5 segundos de grabación no se detectó suficiente volumen o sonido vocal en la nota{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">{selectedTargetNoteName}</strong>.
            </p>
          </div>
        </div>

        {/* Actionable Tips */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Consejos para un diagnóstico preciso:
          </h5>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>Acércate al micrófono:</strong> Asegúrate de que no esté cubierto por tu mano o funda.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>Canta con volumen firme:</strong> Emite un sonido vocal continuo (ej. "Aaaaa" u "Ooooo") sin susurrar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-500">•</span>
              <span><strong>Permiso del micrófono:</strong> Confirma que el navegador tenga permiso concedido para usar el micrófono.</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-2xl tactile-btn-primary font-heading font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md text-center"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Reintentar Grabación (5s)</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
          >
            <span>Volver al Teclado</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 animate-fadeIn">
      {/* Overall Score Badge */}
      <div className="bg-[#eff4ff] dark:bg-[#0b1828] rounded-2xl p-4 border border-indigo-100 dark:border-slate-800 text-center space-y-1.5 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Puntuación Vocal Global</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-4 h-4" /> ±{result.centsDeviationAvg || 8} Céntimos
          </span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="font-heading font-extrabold text-5xl text-[#2c2abc] dark:text-[#c0c1ff]">
            {result.score}
            <span className="text-lg text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-left border-l border-slate-300 dark:border-slate-700 pl-3">
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
              result.score >= 90
                ? 'bg-emerald-500 text-white'
                : result.score >= 75
                ? 'bg-indigo-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {result.score >= 90 ? 'Excelente Precision' : result.score >= 75 ? 'Buena Afinación' : 'Afinación a Pulir'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Nota Evaluada: <strong>{selectedTargetNoteName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Desglose de Rendimiento Vocal</span>
          <span className="text-[10px] text-slate-400">{result.rangeDetected}</span>
        </h4>

        {/* Pitch Accuracy */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
            <span>Precisión de Afinación</span>
            <span className="text-[#2c2abc] dark:text-[#c0c1ff]">{result.pitchAccuracy}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#4648d4] rounded-full transition-all duration-700" style={{ width: `${result.pitchAccuracy}%` }} />
          </div>
        </div>

        {/* Pitch Stability */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
            <span>Estabilidad del Tono</span>
            <span className="text-indigo-600 dark:text-indigo-400">{result.pitchStability || 82}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${result.pitchStability || 82}%` }} />
          </div>
        </div>

        {/* Breath Support */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
            <span>Apoyo Diafragmático</span>
            <span className="text-emerald-600 dark:text-emerald-400">{result.breathSupport}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${result.breathSupport}%` }} />
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: Reseña de Puntos de Mejora */}
      <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/70 dark:from-[#0f233a] dark:to-[#0b1828] p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4648d4] dark:text-[#c0c1ff]">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="uppercase tracking-wider font-extrabold">Reseña de Puntos de Mejora</span>
          </div>

          {result.tunerHistorySummary && result.tunerHistorySummary.totalNotesTuned > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/60 flex items-center gap-1">
              <History className="w-3 h-3" /> Con Contexto del Afinador
            </span>
          )}
        </div>

        {/* Actionable improvement points list */}
        <div className="space-y-2 pt-0.5">
          {result.improvementPoints && result.improvementPoints.map((point, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-100/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-xs"
            >
              <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* AI Feedback Summary sentence */}
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/60 dark:border-slate-800/60 italic">
          "{result.feedbackMsg}"
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>Repetir Diagnóstico</span>
        </button>

        <button
          onClick={onClose}
          className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl tactile-btn-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-center"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>Guardar y Cerrar</span>
        </button>
      </div>
    </div>
  );
};
