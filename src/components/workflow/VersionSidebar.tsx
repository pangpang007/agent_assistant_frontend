import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { versionService } from '@/services/versionService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { VersionRecord } from '@/types/phase6';
import { RollbackConfirmModal } from './RollbackConfirmModal';
import { VersionDiffView } from './VersionDiffView';
import { VersionListItem } from './VersionListItem';
import { parseGraphJson } from '@/lib/workflow/versionDiff';
import './version-sidebar.css';

export interface VersionSidebarProps {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  currentVersionNumber: number;
  onPreview?: (version: VersionRecord) => void;
  onRollbackComplete?: () => void;
}

export function VersionSidebar({
  open,
  onClose,
  workflowId,
  currentVersionNumber,
  onPreview,
  onRollbackComplete,
}: VersionSidebarProps) {
  const { success, error: toastError } = useToast();
  const loadFromWorkflow = useWorkflowEditorStore((s) => s.loadFromWorkflow);
  const workflowName = useWorkflowEditorStore((s) => s.workflowName);
  const workflowDescription = useWorkflowEditorStore((s) => s.workflowDescription);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const setRightPanel = useWorkflowEditorStore((s) => s.setRightPanel);

  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<VersionRecord | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<VersionRecord[]>([]);
  const [diffPair, setDiffPair] = useState<{ a: VersionRecord; b: VersionRecord } | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await versionService.getVersions(workflowId);
      setVersions(list ?? []);
    } catch {
      setVersions([]);
      toastError('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  }, [workflowId, toastError]);

  useEffect(() => {
    if (open) void fetchVersions();
  }, [open, fetchVersions]);

  const handlePreview = (version: VersionRecord) => {
    const graph = version.nodes?.length
      ? { nodes: version.nodes, edges: version.edges ?? [] }
      : parseGraphJson(version.nodes_json, version.edges_json);
    loadFromWorkflow(
      workflowId,
      workflowName,
      workflowDescription,
      graph.nodes,
      graph.edges,
      version.version_number,
    );
    setRightPanel('properties');
    onPreview?.(version);
    success(`正在预览 v${version.version_number}`);
  };

  const handleCompare = (version: VersionRecord) => {
    const current = versions.find((v) => v.version_number === currentVersionNumber);
    if (current) {
      setDiffPair({ a: version, b: current });
    } else {
      setCompareMode(true);
      setCompareSelection([version]);
    }
  };

  const handleCompareSelect = (version: VersionRecord) => {
    setCompareSelection((prev) => {
      if (prev.some((v) => v.id === version.id)) {
        return prev.filter((v) => v.id !== version.id);
      }
      if (prev.length >= 2) return [version];
      const next = [...prev, version];
      if (next.length === 2) {
        const sorted = [...next].sort((a, b) => a.version_number - b.version_number);
        setDiffPair({ a: sorted[0], b: sorted[1] });
        setCompareMode(false);
        setCompareSelection([]);
      }
      return next;
    });
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    setRollbackLoading(true);
    try {
      await versionService.rollback(workflowId, rollbackTarget.id);
      const graph = rollbackTarget.nodes?.length
        ? { nodes: rollbackTarget.nodes, edges: rollbackTarget.edges ?? [] }
        : parseGraphJson(rollbackTarget.nodes_json, rollbackTarget.edges_json);
      loadFromWorkflow(
        workflowId,
        workflowName,
        workflowDescription,
        graph.nodes,
        graph.edges,
        rollbackTarget.version_number,
      );
      pushHistory();
      success(`已回滚到 v${rollbackTarget.version_number}`);
      setRollbackTarget(null);
      void fetchVersions();
      onRollbackComplete?.();
    } catch {
      toastError('回滚失败');
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleTagSave = async (version: VersionRecord, tag: string | null) => {
    try {
      await versionService.updateTag(workflowId, version.id, tag);
      setVersions((prev) =>
        prev.map((v) => (v.id === version.id ? { ...v, tag } : v)),
      );
      success('标签已更新');
    } catch {
      toastError('更新标签失败');
    }
  };

  if (diffPair) {
    return (
      <VersionDiffView
        workflowId={workflowId}
        versionA={diffPair.a}
        versionB={diffPair.b}
        onClose={() => setDiffPair(null)}
      />
    );
  }

  if (!open) return null;

  return (
    <>
      <aside className="version-sidebar">
        <div className="version-sidebar__header">
          <h2 className="version-sidebar__title">版本历史</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </div>
        <div className="version-sidebar__current">当前: v{currentVersionNumber}</div>
        {compareMode ? (
          <div style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            选择两个版本进行对比
            <Button size="sm" variant="ghost" onClick={() => { setCompareMode(false); setCompareSelection([]); }}>
              取消
            </Button>
          </div>
        ) : null}
        <div className="version-sidebar__body">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} />)
          ) : versions.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: 'var(--space-3)' }}>
              暂无历史版本
            </p>
          ) : (
            versions.map((version) => (
              <VersionListItem
                key={version.id}
                version={version}
                isCurrent={version.version_number === currentVersionNumber}
                compareMode={compareMode}
                compareSelected={compareSelection.some((v) => v.id === version.id)}
                onPreview={handlePreview}
                onCompare={handleCompare}
                onRollback={setRollbackTarget}
                onTagSave={handleTagSave}
                onCompareSelect={handleCompareSelect}
              />
            ))
          )}
        </div>
      </aside>

      <RollbackConfirmModal
        open={Boolean(rollbackTarget)}
        onClose={() => setRollbackTarget(null)}
        onConfirm={() => void handleRollback()}
        version={rollbackTarget}
        loading={rollbackLoading}
      />
    </>
  );
}
