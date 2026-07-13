import { useEffect } from 'react';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

interface UseWorkflowShortcutsOptions {
  onSave: () => void;
}

export function useWorkflowShortcuts({ onSave }: UseWorkflowShortcutsOptions) {
  const undo = useWorkflowEditorStore((s) => s.undo);
  const redo = useWorkflowEditorStore((s) => s.redo);
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const selectedEdgeId = useWorkflowEditorStore((s) => s.selectedEdgeId);
  const removeNode = useWorkflowEditorStore((s) => s.removeNode);
  const removeEdge = useWorkflowEditorStore((s) => s.removeEdge);
  const duplicateNode = useWorkflowEditorStore((s) => s.duplicateNode);
  const pushHistory = useWorkflowEditorStore((s) => s.pushHistory);
  const selectNode = useWorkflowEditorStore((s) => s.selectNode);
  const selectEdge = useWorkflowEditorStore((s) => s.selectEdge);
  const toggleNodeLibrary = useWorkflowEditorStore((s) => s.toggleNodeLibrary);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === 's') {
        e.preventDefault();
        onSave();
      }
      if (mod && e.key === 'd' && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
        pushHistory();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleNodeLibrary();
      }
      if (e.key === 'Escape') {
        selectNode(null);
        selectEdge(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
          pushHistory();
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
          pushHistory();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    duplicateNode,
    onSave,
    pushHistory,
    redo,
    removeEdge,
    removeNode,
    selectEdge,
    selectNode,
    selectedEdgeId,
    selectedNodeId,
    toggleNodeLibrary,
    undo,
  ]);
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}
