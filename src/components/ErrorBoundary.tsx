'use client';
import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Copy, Check, Terminal } from 'lucide-react';
import { logger, LogEntry } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showLogs: boolean;
  recentLogs: LogEntry[];
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showLogs: false,
      recentLogs: [],
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, recentLogs: logger.getLogs() });
    logger.error('ReactBoundary', error.message || 'Error de renderizado en React', {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('laclave_last_streak_date');
    } catch {}
    window.location.reload();
  };

  private handleCopyLogs = async () => {
    const errorText = `--- LA CLAVE ERROR REPORT ---
Time: ${new Date().toISOString()}
Error: ${this.state.error?.toString() || 'N/A'}
Stack: ${this.state.error?.stack || 'N/A'}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}

--- SYSTEM LOGS ---
${logger.exportLogsAsString()}`;

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      console.log('Error copiando logs al portapapeles');
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09111e] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
          <div className="max-w-lg w-full bg-[#102034] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div>
              <h1 className="font-heading font-black text-xl sm:text-2xl text-white">
                ¡Ups! Algo se interrumpió en La Clave
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Ocurrió un inconveniente al cargar la interfaz. Hemos registrado el evento de forma segura.
              </p>
            </div>

            {/* Main Error Detail */}
            {this.state.error && (
              <div className="text-[11px] font-mono text-amber-300/90 bg-slate-900/90 p-3.5 rounded-2xl text-left overflow-auto max-h-32 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Detalle Técnico:</span>
                </div>
                <div className="break-words">{this.state.error.toString()}</div>
              </div>
            )}

            {/* Toggle System Logs View */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showLogs: !prev.showLogs, recentLogs: logger.getLogs() }))}
                className="text-[11px] font-bold text-slate-400 underline cursor-pointer transition-colors"
              >
                {this.state.showLogs ? 'Ocultar historial de logs' : 'Ver historial de logs (Diagnóstico)'}
              </button>

              <button
                type="button"
                onClick={this.handleCopyLogs}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Logs Copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Diagnóstico</span>
                  </>
                )}
              </button>
            </div>

            {/* Expanded Logs Table */}
            {this.state.showLogs && (
              <div className="text-[10px] font-mono bg-slate-950 p-3 rounded-2xl text-left border border-slate-800 max-h-48 overflow-y-auto space-y-1.5">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>LOGS RECIENTES EN MEMORIA ({this.state.recentLogs.length}):</span>
                </div>
                {this.state.recentLogs.length === 0 ? (
                  <div className="text-slate-500 italic">No hay logs registrados.</div>
                ) : (
                  this.state.recentLogs.map((l) => (
                    <div key={l.id} className="leading-tight border-b border-slate-900/60 pb-1">
                      <span className="text-slate-500">[{l.timestamp}]</span>{' '}
                      <span
                        className={
                          l.level === 'error'
                            ? 'text-rose-400 font-bold'
                            : l.level === 'warn'
                            ? 'text-amber-400 font-bold'
                            : 'text-indigo-300'
                        }
                      >
                        [{l.category}]
                      </span>{' '}
                      <span className="text-slate-200">{l.message}</span>
                      {l.details && (
                        <div className="text-slate-500 text-[9px] pl-2 break-all">
                          {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 text-white font-heading font-black text-xs rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Reiniciar Aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

