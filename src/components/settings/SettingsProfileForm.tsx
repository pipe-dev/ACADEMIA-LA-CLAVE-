'use client';
import React, { useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
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
  } | null;
}

export const SettingsProfileForm: React.FC<SettingsProfileFormProps> = ({
  name,
  onNameChange,
  vocalRange,
  onVocalRangeChange,
  avatarUrl,
  onAvatarChange,
  sessionUser,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Suscripcion Academia
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono mt-0.5 truncate">
              {sessionUser.email}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs shrink-0 whitespace-nowrap">
            {sessionUser.daysRemaining} dias restantes
          </span>
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
