import { detectCycle } from './cycleDetection';
import { extractVariableRefs, getAvailableVariables } from './variableResolver';
import type { ValidationIssue, WorkflowEdge, WorkflowNode } from '@/types';

function issueId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const startNodes = nodes.filter((n) => n.type === 'start');
  const endNodes = nodes.filter((n) => n.type === 'end');
  const processingNodes = nodes.filter((n) => n.type !== 'start' && n.type !== 'end');

  if (startNodes.length === 0) {
    issues.push({ id: issueId(), level: 'error', message: '工作流缺少开始节点' });
  } else if (startNodes.length > 1) {
    issues.push({ id: issueId(), level: 'error', message: '工作流只能有一个开始节点' });
  }

  if (endNodes.length === 0) {
    issues.push({ id: issueId(), level: 'warning', message: '建议添加结束节点' });
  }

  if (processingNodes.length === 0 && nodes.length <= 1) {
    issues.push({ id: issueId(), level: 'error', message: '请至少添加一个处理节点' });
  }

  const connectedNodeIds = new Set<string>();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  nodes.forEach((node) => {
    if (node.type === 'start' || node.type === 'end') return;
    const hasConnection = connectedNodeIds.has(node.id);
    if (!hasConnection && nodes.length > 1) {
      issues.push({
        id: issueId(),
        level: 'warning',
        nodeId: node.id,
        message: `节点「${node.data.label}」未连接任何连线`,
      });
    }
  });

  const cycle = detectCycle(nodes, edges);
  if (cycle && cycle.length > 0) {
    issues.push({
      id: issueId(),
      level: 'error',
      message: '检测到循环依赖',
    });
  }

  nodes.forEach((node) => {
    const available = getAvailableVariables(node.id, nodes, edges);
    const configStr = JSON.stringify(node.data.config);
    const invalidRefs = extractVariableRefs(configStr).filter(
      (ref) => !available.some((v) => v.fullRef === ref),
    );
    invalidRefs.forEach((ref) => {
      issues.push({
        id: issueId(),
        level: 'error',
        nodeId: node.id,
        message: `节点「${node.data.label}」引用了不存在的变量 \${${ref}}`,
      });
    });

    if (node.type === 'agent') {
      const agentId = node.data.config.agentId;
      if (!agentId) {
        issues.push({
          id: issueId(),
          level: 'error',
          nodeId: node.id,
          message: `节点「${node.data.label}」未选择 Agent`,
        });
      }
    }

    if (node.type === 'code') {
      const code = node.data.config.code as string;
      if (!code?.trim()) {
        issues.push({
          id: issueId(),
          level: 'warning',
          nodeId: node.id,
          message: `节点「${node.data.label}」代码不能为空`,
        });
      }
    }
  });

  return issues;
}
