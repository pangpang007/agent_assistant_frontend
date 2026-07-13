import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Bot,
  Clock,
  Code,
  Columns,
  Combine,
  FileCode,
  FormInput,
  GitBranch,
  Globe,
  Play,
  Repeat,
  Square,
  TestTubes,
  UserCheck,
} from 'lucide-react';

const NODE_ICONS: Record<string, LucideIcon> = {
  Play,
  Square,
  Bot,
  BookOpen,
  GitBranch,
  FormInput,
  Columns,
  Repeat,
  UserCheck,
  TestTubes,
  Clock,
  Code,
  FileCode,
  Combine,
  Globe,
};

interface NodeLibraryIconProps {
  name: string;
  color: string;
  size?: number;
}

export function NodeLibraryIcon({ name, color, size = 18 }: NodeLibraryIconProps) {
  const Icon = NODE_ICONS[name] ?? Bot;
  return <Icon size={size} strokeWidth={1.5} style={{ color }} />;
}
