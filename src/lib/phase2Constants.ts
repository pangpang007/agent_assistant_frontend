import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Braces,
  Building,
  Code,
  FileText,
  FolderOpen,
  Globe,
  Play,
  Search,
  Send,
  Server,
  TestTube,
  Type,
  Wrench,
} from 'lucide-react';
import type { MemoryStrategy, OutputFormat, ToolType } from '@/types';

export const MEMORY_STRATEGY_LABELS: Record<MemoryStrategy, string> = {
  none: '无记忆',
  window: '窗口记忆',
  summary: '摘要记忆',
};

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  markdown: 'Markdown',
  json: 'JSON',
  text: '纯文本',
};

const PRESET_AGENT_ICONS: Record<string, LucideIcon> = {
  'preset-pm': FileText,
  'preset-frontend': Code,
  'preset-backend': Server,
  'preset-tester': TestTube,
  'preset-reviewer': Search,
  'preset-architect': Building,
};

const PRESET_TOOL_ICONS: Record<string, LucideIcon> = {
  'preset-web-search': Search,
  'preset-web-scrape': Globe,
  'preset-code-exec': Play,
  'preset-file-io': FolderOpen,
  'preset-http-request': Send,
  'preset-json-parse': Braces,
  'preset-text-process': Type,
};

export function getAgentIcon(agentId: string, type: 'preset' | 'custom'): LucideIcon {
  if (type === 'custom') return Bot;
  return PRESET_AGENT_ICONS[agentId] ?? Bot;
}

export function getToolIcon(toolId: string, type: 'preset' | 'custom'): LucideIcon {
  if (type === 'custom') return Wrench;
  return PRESET_TOOL_ICONS[toolId] ?? Wrench;
}

export function getToolIconBgClass(toolId: string, type: ToolType): string {
  if (type === 'custom') return 'tool-card__icon--default';
  const map: Record<string, string> = {
    'preset-web-search': 'tool-card__icon--primary',
    'preset-web-scrape': 'tool-card__icon--info',
    'preset-code-exec': 'tool-card__icon--success',
    'preset-file-io': 'tool-card__icon--warning',
    'preset-http-request': 'tool-card__icon--primary',
    'preset-json-parse': 'tool-card__icon--success',
    'preset-text-process': 'tool-card__icon--warning',
  };
  return map[toolId] ?? 'tool-card__icon--default';
}

export const SUPPLIER_TYPE_LABELS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  custom: '自定义',
} as const;
