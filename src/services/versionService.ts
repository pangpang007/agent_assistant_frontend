import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type { VersionDiff, VersionRecord } from '@/types/phase6';
import type { Workflow, WorkflowVersion } from '@/types';

function normalizeVersion(raw: Record<string, unknown>): VersionRecord {
  const versionNumber = Number(raw.version_number ?? raw.version ?? 0);
  return {
    id: String(raw.id ?? versionNumber),
    workflow_id: String(raw.workflow_id ?? ''),
    version_number: versionNumber,
    tag: (raw.tag as string | null | undefined) ?? (raw.label as string | null | undefined) ?? null,
    nodes_json: raw.nodes_json as string | undefined,
    edges_json: raw.edges_json as string | undefined,
    nodes: raw.nodes as VersionRecord['nodes'],
    edges: raw.edges as VersionRecord['edges'],
    node_count: Number(raw.node_count ?? 0),
    edge_count: Number(raw.edge_count ?? 0),
    note: (raw.note as string | undefined) ?? undefined,
    created_at: String(raw.created_at ?? ''),
    created_by: String(raw.created_by ?? ''),
  };
}

/** Map Phase 6 version to Phase 4 WorkflowVersion shape for existing UI. */
export function toWorkflowVersion(v: VersionRecord): WorkflowVersion {
  return {
    id: v.id,
    version: v.version_number,
    label: v.tag ?? undefined,
    note: v.note ?? v.tag ?? undefined,
    node_count: v.node_count ?? 0,
    edge_count: v.edge_count ?? 0,
    created_at: v.created_at,
    created_by: v.created_by,
  };
}

export const versionService = {
  getVersions: async (workflowId: string): Promise<VersionRecord[]> => {
    const res = await http.get(`/workflows/${workflowId}/versions`);
    return pickList<Record<string, unknown>>(res, ['versions', 'items', 'results']).map(
      normalizeVersion,
    );
  },

  getVersion: async (workflowId: string, versionId: string): Promise<VersionRecord> => {
    const res = (await http.get(
      `/workflows/${workflowId}/versions/${versionId}`,
    )) as Record<string, unknown>;
    return normalizeVersion(res ?? { id: versionId });
  },

  /** Prefer numeric version when backend uses /versions/:version */
  getVersionByNumber: async (workflowId: string, version: number): Promise<Workflow> =>
    http.get(`/workflows/${workflowId}/versions/${version}`),

  rollback: async (
    workflowId: string,
    versionId: string,
  ): Promise<{ version: VersionRecord }> => {
    const res = (await http.post(
      `/workflows/${workflowId}/versions/${versionId}/rollback`,
    )) as Record<string, unknown>;
    const versionRaw = (res.version as Record<string, unknown>) ?? res;
    return { version: normalizeVersion(versionRaw ?? {}) };
  },

  getDiff: async (workflowId: string, v1: string, v2: string): Promise<VersionDiff> => {
    try {
      const res = await http.get(`/workflows/${workflowId}/versions/diff`, {
        params: { v1, v2 },
      });
      return {
        added_nodes: pickList(res, ['added_nodes']),
        removed_nodes: pickList(res, ['removed_nodes']),
        modified_nodes: pickList(res, ['modified_nodes']),
        added_edges: pickList(res, ['added_edges']),
        removed_edges: pickList(res, ['removed_edges']),
      };
    } catch {
      return {
        added_nodes: [],
        removed_nodes: [],
        modified_nodes: [],
        added_edges: [],
        removed_edges: [],
      };
    }
  },

  updateTag: (workflowId: string, versionId: string, tag: string | null): Promise<void> =>
    http.put(`/workflows/${workflowId}/versions/${versionId}`, { tag }),
};
