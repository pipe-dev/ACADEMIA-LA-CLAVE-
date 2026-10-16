'use client';
import React, { useRef, useState } from 'react';
import { Camera, Check, Loader2, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { DEFAULT_VOCAL_AVATARS } from '../friends/friendsTypes';
import { uploadAvatarToImgBB } from '../../utils/imgbbHelper';

interface SettingsProfileFormProps {
  name: string;
  onNameChange: (val: string) => void;
  vocalRange: string;
  onVocalRangeChange: (val: string) => void;
  avatarUrl: string;
  onAvatarChange: (val: string) => void;
  sessionUser?: {
    email: string;
    daysRemaining: number;
    expiresAt?: string;
  } | null;
  onRefreshSession?: () => Promise<void> | void;
}

export const SettingsProfileForm: React.FC<SettingsProfileFormProps> = ({
  name,
  onNameChange,
  vocalRange,
  onVocalRangeChange,
  avatarUrl,
  onAvatarChange,
  sessionUser,
  onRefreshSession,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleSyncSession = async () => {
    if (!onRefreshSession || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshSession();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadAvatarToImgBB(file);
      if (res.success && res.url) {
        onAvatarChange(res.url);
      } else {
        setUploadError(res.error || 'No se pudo subir la foto. Intenta con otra imagen.');
      }
    } catch {
      setUploadError('Error al procesar la imagen.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentAvatar = avatarUrl || DEFAULT_VOCAL_AVATARS[0].url;

  return (
    <div className="space-y-4">
      {sessionUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/30 border border-emerald-500/25 space-y-3.5 shadow-xs">
          {/* Fila Superior: Título y Botón de Actualizar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Membresía Oficial
                </div>
                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                  Academia La Clave
                </div>
              </div>
            </div>

            {onRefreshSession && (
              <button
                type="button"
                onClick={handleSyncSession}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                title="Sincronizar vigencia con el servidor"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Actualizando' : 'Actualizar'}</span>
              </button>
            )}
          </div>

          {/* Email y Rol del Estudiante */}
          <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/15">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Usuario Registrado
            </div>
            <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 break-all mt-0.5">
              {sessionUser.email}
            </div>
          </div>

          {/* Cuadrícula de Vigencia: Días y Fecha sin comprimir */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/15">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Días Restantes
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-base font-black ${
                  sessionUser.daysRemaining > 5
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : sessionUser.daysRemaining > 0
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}>
                  {sessionUser.daysRemaining > 0 ? `${sessionUser.daysRemaining} días` : 'Vencida'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/15">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Fecha Límite</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                {sessionUser.expiresAt
                  ? new Date(sessionUser.expiresAt).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Sin fecha'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Foto de Perfil con ImgBB y avatares vocales */}
      <div className="p-4 rounded-2xl bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
          Foto de Perfil
        </label>

        <div className="flex items-center gap-3.5">
          <div className="relative w-16 h-16 rounded-full border-2 border-[#4648d4] overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 shadow-xs">
            <img
              src={currentAvatar}
              alt="Avatar de perfil"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4648d4] text-white hover:bg-[#3b3dbb] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              {isUploading ? 'Guardando foto...' : 'Cambiar foto'}
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sube una foto propia o elige uno de los avatares vocales.
            </p>
            {uploadError && (
              <p className="text-[11px] font-medium text-rose-500">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        {/* Selector de avatares vocales predeterminados */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
            Avatares vocales predeterminados:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DEFAULT_VOCAL_AVATARS.map((av) => {
              const isSelected = avatarUrl === av.url;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => onAvatarChange(av.url)}
                  title={av.name}
                  className={`relative w-9 h-9 rounded-full shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#4648d4] ring-2 ring-[#4648d4]/30 scale-105'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={av.url}
                    alt={av.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#4648d4]/40 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
          Nombre de Usuario
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs"
          placeholder="Tu nombre o apodo"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
          Clasificación Vocal Predeterminada
        </label>
        <select
          value={vocalRange}
          onChange={(e) => onVocalRangeChange(e.target.value)}
          className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs cursor-pointer"
        >
          <option value="Soprano">Soprano (Agudo Femenino)</option>
          <option value="Mezzosoprano">Mezzosoprano (Medio Femenino)</option>
          <option value="Alto">Contralto / Alto (Grave Femenino)</option>
          <option value="Tenor">Tenor (Agudo Masculino)</option>
          <option value="Barítono">Barítono (Medio Masculino)</option>
          <option value="Bajo">Bajo (Grave Masculino)</option>
        </select>
      </div>
    </div>
  );
};
