import { useEffect } from 'react';
import { useExecutionStore } from '@/stores/executionStore';

/** Tick totalDuration while execution is running. */
export function useExecutionTimer(enabled: boolean) {
  const startedAt = useExecutionStore((s) => s.startedAt);
  const setTotalDuration = useExecutionStore((s) => s.setTotalDuration);

  useEffect(() => {
    if (!enabled || !startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => {
      setTotalDuration(Math.max(0, Date.now() - start));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [enabled, setTotalDuration, startedAt]);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
