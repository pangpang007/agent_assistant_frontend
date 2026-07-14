import { beforeEach, describe, expect, it } from 'vitest';
import { formatDuration } from '@/hooks/useExecutionTimer';
import { isExecutionActive, useExecutionStore } from '@/stores/executionStore';

describe('executionStore (Phase 5)', () => {
  beforeEach(() => {
    useExecutionStore.getState().reset();
  });

  it('initNodeStates creates pending nodes', () => {
    useExecutionStore.getState().initNodeStates([
      { id: 'a', name: '开始', type: 'start' },
      { id: 'b', name: 'Agent', type: 'agent' },
    ]);
    const state = useExecutionStore.getState();
    expect(state.totalNodeCount).toBe(2);
    expect(state.getNodeState('a')?.status).toBe('pending');
  });

  it('updateNodeStatus replaces Map immutably', () => {
    useExecutionStore.getState().initNodeStates([{ id: 'a', name: '开始', type: 'start' }]);
    const before = useExecutionStore.getState().nodeStates;
    useExecutionStore.getState().updateNodeStatus('a', { status: 'running' });
    const after = useExecutionStore.getState().nodeStates;
    expect(before).not.toBe(after);
    expect(after.get('a')?.status).toBe('running');
  });

  it('setCompleted / setFailed update terminal status', () => {
    useExecutionStore.getState().setCompleted({ result: 'ok' }, 1200);
    expect(useExecutionStore.getState().status).toBe('completed');
    useExecutionStore.getState().reset();
    useExecutionStore.getState().setFailed('n1', 'boom');
    expect(useExecutionStore.getState().status).toBe('failed');
    expect(useExecutionStore.getState().errorMessage).toBe('boom');
  });
});

describe('execution helpers (Phase 5)', () => {
  it('isExecutionActive', () => {
    expect(isExecutionActive('running')).toBe(true);
    expect(isExecutionActive('waiting_review')).toBe(true);
    expect(isExecutionActive('completed')).toBe(false);
    expect(isExecutionActive('idle')).toBe(false);
  });

  it('formatDuration', () => {
    expect(formatDuration(320)).toBe('320ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(65_000)).toMatch(/1m/);
  });
});
