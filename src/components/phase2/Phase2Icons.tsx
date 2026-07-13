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
import type { AgentType, ToolType } from '@/types';

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

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

export function AgentIcon({ id, type, size = 20, strokeWidth = 1.5 }: IconProps & { id: string; type: AgentType }) {
  if (type === 'custom') return <Bot size={size} strokeWidth={strokeWidth} />;
  const Icon = PRESET_AGENT_ICONS[id] ?? Bot;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}

export function ToolIcon({ id, type, size = 20, strokeWidth = 1.5 }: IconProps & { id: string; type: ToolType }) {
  if (type === 'custom') return <Wrench size={size} strokeWidth={strokeWidth} />;
  const Icon = PRESET_TOOL_ICONS[id] ?? Wrench;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}
