'use client';

import { cn } from '@/lib/utils';
import type { Quest } from '@/hooks/use-daily-quests';
import { CheckCircle2, Circle } from 'lucide-react';

export function DailyQuestsWidget({ quests, allComplete }: { quests: Quest[]; allComplete: boolean }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-black text-sm sm:text-base flex items-center gap-1.5">
          🎯 Misiones del Día
        </h3>
        {allComplete && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full">✨ ¡Completadas!</span>}
      </div>
      <div className="flex flex-col gap-2">
        {quests.map(q => {
          const done = q.current >= q.target;
          const pct = Math.min((q.current / q.target) * 100, 100);
          return (
            <div
              key={q.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                done
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-card/60 border-border/50"
              )}
            >
              <span className="text-xl flex-shrink-0">{q.icon}</span>
              <div className="flex-grow min-w-0">
                <p className={cn("text-xs sm:text-sm font-bold truncate", done && "line-through text-muted-foreground")}>{q.label}</p>
                <div className="w-full h-1.5 bg-muted/30 rounded-full mt-1 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", done ? "bg-emerald-500" : "bg-primary/60")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <span className="text-[10px] font-bold text-muted-foreground">{q.current}/{q.target}</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
