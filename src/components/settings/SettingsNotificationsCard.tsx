'use client';
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  getNotificationSupportStatus,
  getDailyReminderConfig,
  setDailyReminderConfig,
  requestNotificationPermission,
  sendPracticeReminderNotification,
  getRandomPracticeNotificationMessage,
  triggerHapticFeedback,
  NotificationSupportStatus,
} from '../../utils/pwaFeatures';
import { audioService } from '../../utils/audioService';

interface SettingsNotificationsCardProps {
  streak?: number;
}

const PRESET_TIMES = [
  { label: 'Mañana', time: '09:00', desc: 'Despierta tu voz' },
  { label: 'Tarde', time: '15:00', desc: 'Pausa musical' },
  { label: 'Noche', time: '20:00', desc: 'Protege tu racha', recommended: true },
];

export const SettingsNotificationsCard: React.FC<SettingsNotificationsCardProps> = ({
  streak = 1,
}) => {
  const [supportStatus, setSupportStatus] = useState<NotificationSupportStatus>({
    supported: false,
    permission: 'unsupported',
    isIOSWithoutPwa: false,
    isStandalone: false,
  });

  const [config, setConfig] = useState<{ enabled: boolean; time: string }>(() =>
    getDailyReminderConfig()
  );

  const [sampleMessage, setSampleMessage] = useState<{ title: string; body: string }>(() =>
    getRandomPracticeNotificationMessage(streak)
  );

  const [testSent, setTestSent] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  useEffect(() => {
    const status = getNotificationSupportStatus();
    setSupportStatus(status);

    const savedConfig = getDailyReminderConfig();
    setConfig(savedConfig);
    const isPreset = PRESET_TIMES.some((p) => p.time === savedConfig.time);
    setIsCustomMode(!isPreset);
  }, []);

  const handleToggleEnabled = async () => {
    audioService.playClickSound();
    const nextEnabled = !config.enabled;

    if (nextEnabled) {
      if (supportStatus.isIOSWithoutPwa) {
        window.dispatchEvent(
          new CustomEvent('laclave_open_pwa_install_modal', { detail: { reason: 'notifications' } })
        );
        return;
      }

      if (supportStatus.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        const updatedStatus = getNotificationSupportStatus();
        setSupportStatus(updatedStatus);
        if (!granted) {
          return;
        }
      }
    }

    const nextConfig = { ...config, enabled: nextEnabled };
    setConfig(nextConfig);
    setDailyReminderConfig(nextConfig.enabled, nextConfig.time, streak);
    triggerHapticFeedback('light');
  };

  const handleSelectTime = (selectedTime: string) => {
    audioService.playClickSound();
    setIsCustomMode(false);
    const nextConfig = { ...config, time: selectedTime };
    setConfig(nextConfig);
    setDailyReminderConfig(nextConfig.enabled, selectedTime, streak);
    triggerHapticFeedback('light');
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const nextConfig = { ...config, time: val };
    setConfig(nextConfig);
    setDailyReminderConfig(nextConfig.enabled, val, streak);
  };

  const handleCycleSampleMessage = () => {
    audioService.playClickSound();
    setSampleMessage(getRandomPracticeNotificationMessage(streak));
  };

  const handleTestNotification = async () => {
    audioService.playClickSound();
    triggerHapticFeedback('medium');

    if (supportStatus.isIOSWithoutPwa) {
      window.dispatchEvent(
        new CustomEvent('laclave_open_pwa_install_modal', { detail: { reason: 'notifications' } })
      );
      return;
    }

    const sent = await sendPracticeReminderNotification(streak);
    if (sent) {
      setTestSent(true);
      triggerHapticFeedback('success');
      setTimeout(() => setTestSent(false), 3000);
    } else {
      const updatedStatus = getNotificationSupportStatus();
      setSupportStatus(updatedStatus);
    }
  };

  const handleRequestPermissionDirect = async () => {
    audioService.playClickSound();
    const granted = await requestNotificationPermission();
    const updatedStatus = getNotificationSupportStatus();
    setSupportStatus(updatedStatus);
    if (granted) {
      const nextConfig = { ...config, enabled: true };
      setConfig(nextConfig);
      setDailyReminderConfig(true, config.time, streak);
      triggerHapticFeedback('success');
    }
  };

  const handleOpenIosInstructions = () => {
    audioService.playClickSound();
    window.dispatchEvent(
      new CustomEvent('laclave_open_pwa_install_modal', { detail: { reason: 'notifications' } })
    );
  };

  return (
    <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header and Master Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-[#c0c1ff] flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#d3e4fe] flex items-center gap-1.5">
              <span>Recordatorios de Práctica</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Estilo Duolingo
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Avisos amigables para proteger tu racha y no enfriar tu voz
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleEnabled}
          aria-label="Alternar recordatorios de práctica"
          className={`w-12 h-6.5 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
            config.enabled ? 'bg-[#4648d4] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
          }`}
        >
          <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs" />
        </button>
      </div>

      {/* Platform & Permission Banners */}
      {supportStatus.isIOSWithoutPwa ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
              <strong className="block font-bold mb-0.5">Requisito de Apple en iPhone / iPad:</strong>
              Para recibir avisos push en pantalla, iOS exige agregar AfinApp a tu Pantalla de Inicio.
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenIosInstructions}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ver cómo agregar a Pantalla de Inicio</span>
          </button>
        </div>
      ) : supportStatus.permission === 'denied' ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-rose-900 dark:text-rose-200">
            <strong className="block font-bold">Notificaciones bloqueadas en tu navegador:</strong>
            Para reactivarlas, toca el ícono del candado o ajustes del sitio en la barra de tu navegador y permite Notificaciones.
          </div>
        </div>
      ) : supportStatus.permission === 'default' ? (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff] shrink-0" />
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              Permiso de avisos pendiente en este dispositivo.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRequestPermissionDirect}
            className="px-3 py-1.5 bg-[#4648d4] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#383aa8] shrink-0"
          >
            Permitir
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Avisos autorizados y activos en este dispositivo</span>
        </div>
      )}

      {/* Time Picker & Presets */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Horario de tu alarma diaria</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-[#4648d4] dark:text-[#c0c1ff]">
            {config.time}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESET_TIMES.map((preset) => {
            const isSelected = !isCustomMode && config.time === preset.time;
            return (
              <button
                key={preset.time}
                type="button"
                onClick={() => handleSelectTime(preset.time)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#4648d4] text-white border-[#4648d4] shadow-xs'
                    : 'bg-white dark:bg-[#102034] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                {preset.recommended && (
                  <span
                    className={`absolute top-1 right-1 text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                      isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    Top
                  </span>
                )}
                <div className="text-xs font-black">{preset.label}</div>
                <div className={`text-[10px] font-mono ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.time}
                </div>
                <div className={`text-[9px] truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {preset.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Time Selector */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(true);
              audioService.playClickSound();
            }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              isCustomMode
                ? 'bg-indigo-100 dark:bg-indigo-950 text-[#4648d4] dark:text-[#c0c1ff] border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Definir otra hora exacta:
          </button>
          <input
            type="time"
            value={config.time}
            onChange={handleCustomTimeChange}
            onFocus={() => setIsCustomMode(true)}
            aria-label="Seleccionar hora exacta del recordatorio"
            className="text-xs font-mono font-bold bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#4648d4]"
          />
        </div>
      </div>

      {/* Duolingo Style Sample Preview Box */}
      <div className="bg-white dark:bg-[#102034] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Ejemplo de aviso que recibirás</span>
          </div>
          <button
            type="button"
            onClick={handleCycleSampleMessage}
            className="text-[10px] font-bold text-[#4648d4] dark:text-[#c0c1ff] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Ver otra frase</span>
          </button>
        </div>

        <div className="bg-gradient-to-r from-amber-500/5 to-indigo-500/5 border border-indigo-100 dark:border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-[#d3e4fe] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{sampleMessage.title}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            {sampleMessage.body}
          </p>
        </div>
      </div>

      {/* Test Notification Button & Status */}
      <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={handleTestNotification}
          className="w-full sm:flex-1 py-2.5 px-4 bg-white dark:bg-[#102034] hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-[#4648d4] dark:text-[#c0c1ff] font-bold text-xs rounded-2xl shadow-2xs cursor-pointer transition-colors flex items-center justify-center gap-2 group"
        >
          <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          <span>Enviar recordatorio de prueba</span>
        </button>

        {testSent && (
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aviso enviado al dispositivo</span>
          </div>
        )}
      </div>
    </div>
  );
};
