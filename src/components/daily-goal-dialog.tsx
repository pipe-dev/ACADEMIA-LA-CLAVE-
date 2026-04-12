'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDailyQuests, type Quest } from '@/hooks/use-daily-quests';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Sparkles, CheckCircle2, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dbSave, dbLoad } from '@/lib/db';

export function DailyGoalDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { quests } = useDailyQuests();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] sm:max-w-md bg-card border-none rounded-3xl shadow-2xl p-0 overflow-hidden outline-none">
                <div className="relative p-6 px-10 text-center">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-10">
                        <Star className="absolute -top-4 -left-4 w-16 h-16 text-primary rotate-12" />
                        <Sparkles className="absolute top-1/4 -right-8 w-24 h-24 text-accent -rotate-12" />
                        <Zap className="absolute -bottom-4 left-1/4 w-12 h-12 text-yellow-400 rotate-45" />
                    </div>

                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/30"
                    >
                        <Target className="w-12 h-12 text-white" />
                    </motion.div>

                    <DialogHeader className="p-0 mb-8">
                        <DialogTitle className="text-3xl font-black text-foreground mb-2 leading-tight">
                            ¡Tus Metas de Hoy!
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-lg italic">
                            Completa estas misiones para mantener tu racha al máximo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mb-10 text-left">
                        {quests.map((q, idx) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="flex items-center gap-4 bg-muted/30 p-5 rounded-2xl border border-transparent hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="text-3xl">{q.icon}</div>
                                <div className="flex-grow">
                                    <h4 className="font-black text-foreground text-sm uppercase tracking-wide opacity-50 mb-1">Misión {idx + 1}</h4>
                                    <p className="text-foreground font-bold text-lg leading-tight">{q.label}</p>
                                </div>
                                <div className="p-2 bg-background rounded-full border shadow-sm">
                                    <div className="w-6 h-6 rounded-full border-2 border-primary/20" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Button 
                            onClick={onClose} 
                            size="lg" 
                            className="w-full h-16 text-xl font-black bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                        >
                            ¡LO TENGO! 🚀
                        </Button>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
