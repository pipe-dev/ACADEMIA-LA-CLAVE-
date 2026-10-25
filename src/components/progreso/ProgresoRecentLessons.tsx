import React from 'react';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { CompletedLessonEntry } from '../../types';

interface ProgresoRecentLessonsProps {
  recentLessons: CompletedLessonEntry[];
  zenMode?: boolean;
}

export const ProgresoRecentLessons: React.FC<ProgresoRecentLessonsProps> = ({
  recentLessons,
  zenMode = false,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between text-[#0b1c30] dark:text-[#d3e4fe]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4648d4] dark:text-[#c0c1ff]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg">
              Lecciones Recientes
            </h3>
            <p className="text-xs text-slate-400 font-medium">Últimas lecciones completadas</p>
          </div>
        </div>
        {recentLessons.length > 0 && (
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {recentLessons.length} lecciones
          </span>
        )}
      </div>

      {recentLessons.length === 0 ? (
        <div className={`p-5 rounded-2xl border text-center space-y-1 ${
          zenMode ? 'bg-[#1b1c1e] border-[#2e3138]' : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f]'
        }`}>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Aún no has completado lecciones recientes.
          </p>
          <p className={`text-[11px] font-bold ${zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4] dark:text-[#c0c1ff]'}`}>
            ¡Comienza tu primera lección en la pestaña 'Academia'!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentLessons.slice(0, 5).map((lesson) => (
            <div
              key={lesson.id}
              className={`rounded-2xl p-3.5 border shadow-xs flex items-center justify-between gap-3 transition-colors ${
                zenMode
                  ? 'bg-[#1b1c1e] border-[#2e3138] '
                  : 'bg-white dark:bg-[#102034] border border-slate-100 dark:border-[#1b2b3f]  '
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b]'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className={`font-heading font-bold text-xs truncate ${
                    zenMode ? 'text-[#f0ebe1]' : 'text-[#0b1c30] dark:text-[#d3e4fe]'
                  }`}>
                    {lesson.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="truncate">{lesson.unitTitle || 'Academia'}</span>
                    <span>•</span>
                    <span>{lesson.completedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                }`}>
                  <Sparkles className={`w-3 h-3 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'}`} />
                  {lesson.score}%
                </span>
                <span className={`text-[10px] font-extrabold ${zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4] dark:text-[#c0c1ff]'}`}>
                  +{lesson.xpEarned} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
