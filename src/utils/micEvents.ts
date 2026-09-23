'use client';

type MicListener = (active: boolean) => void;
const listeners = new Set<MicListener>();

let activeCount = 0;

export function emitMicActive(active: boolean): void {
  if (active) {
    activeCount++;
  } else {
    activeCount = Math.max(0, activeCount - 1);
  }

  const isAnyMicActive = activeCount > 0;
  listeners.forEach((fn) => {
    try {
      fn(isAnyMicActive);
    } catch (err) {
      console.warn('[MicEvents] Listener error:', err);
    }
  });
}

export function isMicActiveGlobal(): boolean {
  return activeCount > 0;
}

export function subscribeMicActive(listener: MicListener): () => void {
  listeners.add(listener);
  // Emit current state immediately
  listener(activeCount > 0);
  return () => {
    listeners.delete(listener);
  };
}
