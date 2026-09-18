'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '../../../components/Header';
import { BottomNav } from '../../../components/BottomNav';
import { AcademiaView } from '../../../components/AcademiaView';
import { UnitCelebrationModal } from '../../../components/UnitCelebrationModal';
import { LessonModal } from '../../../components/LessonModal';
import { INITIAL_UNITS, INITIAL_USER_STATS } from '../../../data/academyData';
import { Unit, LessonNode, UserStats, TabType } from '../../../types';
import { audioService } from '../../../utils/audioService';
import { Play, RotateCcw, PartyPopper, Sparkles, Drum } from 'lucide-react';

export default function UnitSandboxPage() {
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
  const [activeTab, setActiveTab] = useState<TabType>('academia');
  const [unlockedUnitAnimationId, setUnlockedUnitAnimationId] = useState<number | null>(null);
  const [justUnlockedNodeId, setJustUnlockedNodeId] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<LessonNode | null>(null);

  // Setup Unit 1 completed (confirmed green) and Unit 2 ready with Node 13 current
  const [units, setUnits] = useState<Unit[]>(() => {
    return INITIAL_UNITS.map((u) => {
      if (u.id === 1) {
        return {
          ...u,
          nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
        };
      }
      if (u.id === 2) {
        return {
          ...u,
          nodes: u.nodes.map((n, idx) => (idx === 0 ? { ...n, status: 'current' as const } : n))
        };
      }
      return u;
    });
  });

  // Check URL query params if ?balloon=true or ?unit3=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('balloon')) {
        setShowCelebrationModal(true);
      }
      if (window.location.search.includes('unit3')) {
        setUnits((prev) =>
          prev.map((u) => {
            if (u.id === 1 || u.id === 2) {
              return {
                ...u,
                nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
              };
            }
            if (u.id === 3) {
              return {
                ...u,
                nodes: u.nodes.map((n, idx) => (idx === 0 ? { ...n, status: 'current' as const } : { ...n, status: 'locked' as const }))
              };
            }
            return u;
          })
        );
      }
    }
  }, []);

  // Trigger the full Unit 2 unlock animation:
  // Camera descent -> Water fill from left to right -> Padlock arpeggio -> 720ms delay -> 1st Node illuminates with victory bell
  const triggerUnit2UnlockAnimation = () => {
    setUnlockedUnitAnimationId(null);
    setTimeout(() => {
      setUnlockedUnitAnimationId(2);
    }, 60);
  };

  // When clicking "CONTINUAR A LA UNIDAD 2" in the balloon celebration modal
  const handleContinueToUnit2 = () => {
    setShowCelebrationModal(false);
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === 1) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
          };
        }
        if (u.id === 2) {
          const hasCompletedInUnit2 = u.nodes.some((n) => n.status === 'completed');
          const hasCurrentInUnit2 = u.nodes.some((n) => n.status === 'current');

          return {
            ...u,
            nodes: u.nodes.map((n, idx) => {
              if (n.status === 'completed') return n;
              if (idx === 0 && !hasCompletedInUnit2 && !hasCurrentInUnit2) {
                return { ...n, status: 'current' as const };
              }
              return n;
            })
          };
        }
        return u;
      })
    );
    triggerUnit2UnlockAnimation();
  };

  // Reset units to fresh Unit 1 completed / Unit 2 ready state
  const handleReset = () => {
    setUnlockedUnitAnimationId(null);
    setShowCelebrationModal(false);
    setSelectedNode(null);
    setUnits(
      INITIAL_UNITS.map((u) => {
        if (u.id === 1) {
          return {
            ...u,
            nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
          };
        }
        if (u.id === 2) {
          return {
            ...u,
            nodes: u.nodes.map((n, idx) => (idx === 0 ? { ...n, status: 'current' as const } : n))
          };
        }
        return u;
      })
    );
    audioService.playSoftDing();
  };

  // Handle lesson completion inside the sandbox
  const handleCompleteNode = (nodeId: string) => {
    const targetNode = units.flatMap((u) => u.nodes).find((n) => n.id === nodeId);
    const isExamNode = nodeId === 'u1-node12.5' || 
                       targetNode?.type === 'exam' || 
                       Boolean(targetNode?.title?.toLowerCase().includes('evaluaci'));
    if (isExamNode) {
      setUnlockedUnitAnimationId(null);
      setSelectedNode(null);
      setShowCelebrationModal(true);
      return;
    }

    let nextId: string | null = null;
    const completedUnit = units.find((u) => u.nodes.some((n) => n.id === nodeId));
    if (completedUnit) {
      const completedNodeIdx = completedUnit.nodes.findIndex((n) => n.id === nodeId);
      if (completedNodeIdx !== -1 && completedNodeIdx + 1 < completedUnit.nodes.length) {
        nextId = completedUnit.nodes[completedNodeIdx + 1].id;
      }
    }

    setUnits((prev) =>
      prev.map((u) => ({
        ...u,
        nodes: u.nodes.map((n) => {
          if (n.id === nodeId) return { ...n, status: 'completed' as const };
          if (nextId && n.id === nextId) return { ...n, status: 'current' as const };
          return n;
        })
      }))
    );
    setSelectedNode(null);

    if (nextId) {
      setJustUnlockedNodeId(null);
      setTimeout(() => {
        setJustUnlockedNodeId(nextId);
      }, 150);
    }
  };

  // Quick helper to test unlocking the next node in sequence with sound, glow, and pop!
  const triggerNextNodeUnlock = () => {
    const currentNode = units.flatMap((u) => u.nodes).find((n) => n.status === 'current');
    if (currentNode) {
      handleCompleteNode(currentNode.id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#070b14] text-slate-800 dark:text-slate-100 relative selection:bg-indigo-500 selection:text-white">
      {/* Floating Sandbox Control Toolbar */}
      <div className="sticky top-0 z-[60] bg-slate-900/95 text-white backdrop-blur-md border-b border-indigo-500/30 px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-indigo-200">
            Sandbox: Academia View
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioService.playClickSound();
              setShowCelebrationModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Probar Globo</span>
          </button>

          <button
            onClick={() => {
              audioService.playClickSound();
              triggerUnit2UnlockAnimation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Probar Desbloqueo U2</span>
          </button>

          <button
            onClick={() => {
              audioService.playClickSound();
              setUnits((prev) =>
                prev.map((u) => {
                  if (u.id === 1 || u.id === 2) {
                    return {
                      ...u,
                      nodes: u.nodes.map((n) => ({ ...n, status: 'completed' as const }))
                    };
                  }
                  if (u.id === 3) {
                    return {
                      ...u,
                      nodes: u.nodes.map((n, idx) => (idx === 0 ? { ...n, status: 'current' as const } : { ...n, status: 'locked' as const }))
                    };
                  }
                  return u;
                })
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Drum className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ver Unidad 3</span>
          </button>

          <button
            onClick={() => {
              audioService.playClickSound();
              triggerNextNodeUnlock();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Desbloquear siguiente nodo con resplandor y campana"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Siguiente Nodo</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
            title="Reiniciar Estado"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Main App Header */}
      <Header
        userStats={userStats}
        onOpenStore={() => {}}
        onOpenSettings={() => {}}
        onOpenFlameView={() => {}}
      />

      {/* Main Content Body with exact max-w-lg mobile container */}
      <main className="flex-1 w-full max-w-lg mx-auto overflow-x-hidden relative px-4 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-20 pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <AcademiaView
          userStats={userStats}
          units={units}
          onSelectNode={(node) => {
            setUnlockedUnitAnimationId(null);
            setSelectedNode(node);
          }}
          onOpenVoiceEval={() => {}}
          unlockedUnitAnimationId={unlockedUnitAnimationId}
          onClearUnlockedUnitAnimation={() => setUnlockedUnitAnimationId(null)}
          justUnlockedNodeId={justUnlockedNodeId}
          onClearJustUnlockedNode={() => setJustUnlockedNodeId(null)}
          onOpenUnitCelebration={() => {
            setUnlockedUnitAnimationId(null);
            setShowCelebrationModal(true);
          }}
        />
      </main>

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
      />

      {/* Interactive Lesson Modal */}
      {selectedNode && (
        <LessonModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onCompleteNode={handleCompleteNode}
          onOpenUnitCelebration={() => {
            setUnlockedUnitAnimationId(null);
            setSelectedNode(null);
            setShowCelebrationModal(true);
          }}
        />
      )}

      {/* Standalone Fullscreen Unit Culmination Celebration */}
      {showCelebrationModal && (
        <UnitCelebrationModal
          isOpen={showCelebrationModal}
          onContinueToUnit2={handleContinueToUnit2}
        />
      )}
    </div>
  );
}
