import {
  BookOpen,
  Bot,
  Clock,
  FileText,
  GitBranch,
  Globe,
  LayoutTemplate,
  Search,
} from 'lucide-react';
import type { EmptyStateProps } from '@/components/ui/EmptyState';

type EmptyPreset = Pick<EmptyStateProps, 'icon' | 'title' | 'description' | 'action'>;

export const emptyPresets = {
  workflows: (onCreate: () => void): EmptyPreset => ({
    icon: <GitBranch size={64} strokeWidth={1.5} />,
    title: '还没有工作流',
    description: '创建一个开始编排',
    action: { label: '新建工作流', onClick: onCreate },
  }),
  agents: (): EmptyPreset => ({
    icon: <Bot size={64} strokeWidth={1.5} />,
    title: '还没有自定义 Agent',
    description: '从预置 Agent 开始，或创建自己的 Agent',
  }),
  knowledge: (onCreate: () => void): EmptyPreset => ({
    icon: <BookOpen size={64} strokeWidth={1.5} />,
    title: '还没有知识库',
    description: '创建一个知识库支持 RAG 检索增强',
    action: { label: '创建知识库', onClick: onCreate },
  }),
  executions: (onNavigate: () => void): EmptyPreset => ({
    icon: <Clock size={64} strokeWidth={1.5} />,
    title: '还没有执行记录',
    description: '运行一个工作流试试',
    action: { label: '去工作流列表', onClick: onNavigate },
  }),
  templates: (): EmptyPreset => ({
    icon: <LayoutTemplate size={64} strokeWidth={1.5} />,
    title: '暂无模板',
    description: '模板正在路上，敬请期待',
  }),
  apiManagement: (): EmptyPreset => ({
    icon: <Globe size={64} strokeWidth={1.5} />,
    title: '还没有发布任何 API',
    description: '在工作流编辑器中点击「发布为 API」开始',
  }),
  logs: (): EmptyPreset => ({
    icon: <FileText size={64} strokeWidth={1.5} />,
    title: '暂无日志',
    description: '执行工作流后会产生日志记录',
  }),
  search: (query?: string): EmptyPreset => ({
    icon: <Search size={64} strokeWidth={1.5} />,
    title: '未找到匹配结果',
    description: query ? `试试其他关键词，当前搜索：${query}` : '试试其他关键词',
  }),
};

export type EmptyPresetKey = keyof typeof emptyPresets;

export type { EmptyPreset };
