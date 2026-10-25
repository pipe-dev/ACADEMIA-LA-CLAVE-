import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, LogOut } from 'lucide-react';
import { PolygraphCanvas, NoteData } from './polygraph-canvas';

// La melodía objetivo (Apps Script /api/karaoke-melody) fue retirada:
// el polígrafo corre siempre sin curva objetivo, como hasta ahora.
const NO_MELODY: NoteData[] = [];

interface KaraokeControlsPanelProps {
  frequency: number;
  isDetecting: boolean;
  currentTime: number;
  syncOffset: number;
  onHitUpdate: (isHit: boolean) => void;
  vocalLevel: number;
  onSetVocalLevel: (val: number) => void;
  useYtFallback: boolean;
  isMicEnabled: boolean;
  onToggleMic: () => void;
  onSetSyncOffset: (fn: (prev: number) => number) => void;
  onExitToCatalog: () => void;
}

export const KaraokeControlsPanel: React.FC<KaraokeControlsPanelProps> = ({
  frequency,
  isDetecting,
  currentTime,
  syncOffset,
  onHitUpdate,
  vocalLevel,
  onSetVocalLevel,
  useYtFallback,
  isMicEnabled,
  onToggleMic,
  onSetSyncOffset,
  onExitToCatalog
}) => {
  return (
    <div className="space-y-3.5">
      {/* ─── POLÍGRAFO DE AFINACIÓN EN TIEMPO REAL ─── */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tus Notas en Pantalla
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isDetecting ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {isDetecting ? 'Micrófono Activo' : 'Micrófono Inactivo'}
            </span>
          </div>
        </div>

        {/* Lienzo Canvas del Polígrafo */}
        <div className="h-24 sm:h-28 w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-950">
          <PolygraphCanvas
            frequency={frequency}
            isDetecting={isDetecting}
            currentTime={currentTime + syncOffset}
            melodyData={NO_MELODY}
            onHitUpdate={onHitUpdate}
          />
        </div>
      </div>

      {/* ─── CONTROL MINIMALISTA DE VOZ ─── */}
      <div className="bg-white dark:bg-[#102034] rounded-2xl px-4 py-2.5 border border-slate-100 dark:border-[#1b2b3f] shadow-xs flex items-center gap-3 transition-colors">
        <button
          type="button"
          onClick={() => onSetVocalLevel(vocalLevel > 0 ? 0 : 1)}
          className="text-slate-400 transition-colors cursor-pointer shrink-0"
          title={vocalLevel === 0 ? 'Activar voz' : 'Silenciar voz'}
        >
          {vocalLevel === 0 ? (
            <VolumeX className="w-4 h-4 text-slate-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
          )}
        </button>

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          Voz{' '}
          {useYtFallback && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-normal">
              (Respaldo)
            </span>
          )}
        </span>

        <input
          id="vocalLevel"
          name="vocalLevel"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(vocalLevel * 100)}
          onChange={(e) => onSetVocalLevel(Number(e.target.value) / 100)}
          aria-label="Nivel de volumen de voz"
          className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
        />

        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
          {Math.round(vocalLevel * 100)}%
        </span>
      </div>

      {/* ─── BARRA COMPACTA: MICRÓFONO & CALIBRACIÓN DE LETRAS ─── */}
      <div className="bg-white dark:bg-[#102034] rounded-2xl p-2.5 px-4 border border-slate-100 dark:border-[#1b2b3f] shadow-xs flex items-center justify-between gap-3 transition-colors">
        {/* Control de Micrófono */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleMic}
            className="flex items-center gap-2 cursor-pointer group"
            title={isMicEnabled ? 'Desactivar Micrófono' : 'Activar Micrófono'}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isMicEnabled
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-[#c0c1ff]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </div>
            <span className="font-heading font-semibold text-xs text-[#0b1c30] dark:text-[#d3e4fe]">
              {isMicEnabled ? 'Micrófono Activo' : 'Micrófono Inactivo'}
            </span>
          </button>
        </div>

        {/* Ajuste fino de sincronización de letras */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b1828] p-1 px-2 rounded-xl border border-slate-100 dark:border-[#1b2b3f]">
          <span className="text-[10px] font-bold text-slate-400">Letras:</span>
          <button
            onClick={() => onSetSyncOffset((s) => s - 0.5)}
            className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-[11px] shadow-2xs"
            title="Atrasar letra 0.5s"
          >
            -0.5s
          </button>
          <span className="font-mono text-[11px] font-black text-[#2c2abc] dark:text-[#c0c1ff] min-w-[28px] text-center">
            {syncOffset > 0 ? `+${syncOffset}s` : `${syncOffset}s`}
          </span>
          <button
            onClick={() => onSetSyncOffset((s) => s + 0.5)}
            className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-[11px] shadow-2xs"
            title="Adelantar letra 0.5s"
          >
            +0.5s
          </button>
        </div>
      </div>

      {/* Botón Salir */}
      <button
        onClick={onExitToCatalog}
        className="w-full bg-[#eff4ff] dark:bg-[#0b1828] text-[#2c2abc] dark:text-[#c0c1ff] border border-slate-200 dark:border-slate-800 py-3.5 rounded-full font-heading font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Elegir Otra Canción</span>
      </button>
    </div>
  );
};
