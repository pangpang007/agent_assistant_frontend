import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useExecutionStore } from '@/stores/executionStore';
import type { LogEntry } from '@/types/execution';

type LogLevel = LogEntry['level'];

const LEVELS: LogLevel[] = ['info', 'warn', 'error', 'debug'];

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
};

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    return timestamp;
  }
}

export function ExecutionLogStream() {
  const logs = useExecutionStore((s) => s.logs);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(() => new Set(LEVELS));

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (!levelFilter.has(log.level)) return false;
      if (!q) return true;
      return log.message.toLowerCase().includes(q) || log.nodeId.toLowerCase().includes(q);
    });
  }, [levelFilter, logs, search]);

  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [autoScroll, filteredLogs]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (!atBottom && autoScroll) setAutoScroll(false);
  };

  const toggleLevel = (level: LogLevel) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  return (
    <section className="execution-panel__section">
      <div className="log-stream">
        <div className="log-stream__header">
          <span className="execution-panel__section-title" style={{ marginBottom: 0 }}>
            实时日志
          </span>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={autoScroll ? <Pause size={14} /> : <Play size={14} />}
            onClick={() => setAutoScroll((v) => !v)}
          >
            {autoScroll ? '暂停' : '恢复'}
          </Button>
        </div>
        <div className="log-stream__filters">
          {LEVELS.map((level) => (
            <Button
              key={level}
              variant={levelFilter.has(level) ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleLevel(level)}
            >
              {LEVEL_LABELS[level]}
            </Button>
          ))}
        </div>
        <div style={{ padding: '0 var(--space-3) var(--space-2)' }}>
          <Input
            size="sm"
            placeholder="搜索日志..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div ref={containerRef} className="log-stream__body" onScroll={handleScroll}>
          {filteredLogs.length === 0 ? (
            <div className="log-stream__empty">暂无日志</div>
          ) : (
            filteredLogs.map((entry) => (
              <div key={entry.id} className="log-entry">
                <span className="log-entry__time">{formatTime(entry.timestamp)}</span>
                <span className={`log-entry__level log-entry__level--${entry.level}`}>
                  [{LEVEL_LABELS[entry.level]}]
                </span>
                <span
                  className={
                    entry.level === 'error' ? 'log-entry__message log-entry__message--error' : 'log-entry__message'
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))
          )}
          {autoScroll ? (
            <span className="exec-cursor-blink" style={{ color: 'var(--accent-primary)' }}>
              {'> '}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
