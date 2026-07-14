import {
  FileSearch,
  FileText,
  LayoutGrid,
  Microscope,
  User,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { TemplateCategory } from '@/types/phase6';
import type { TagColor } from '@/components/ui/Tag';

export type TemplateCategoryKey = TemplateCategory | 'all';

export interface TemplateCategoryConfig {
  key: TemplateCategoryKey;
  label: string;
  icon: LucideIcon;
  tagColor?: TagColor;
}

export const TEMPLATE_CATEGORIES: TemplateCategoryConfig[] = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'full_pipeline', label: '全流程', icon: Workflow, tagColor: 'primary' },
  { key: 'code_review', label: '代码审查', icon: FileSearch, tagColor: 'warning' },
  { key: 'doc_generation', label: '文档生成', icon: FileText, tagColor: 'success' },
  { key: 'research', label: '研究报告', icon: Microscope, tagColor: 'default' },
  { key: 'custom', label: '自定义', icon: User, tagColor: 'default' },
];

export const SAVE_TEMPLATE_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c.key !== 'all');

export function getCategoryConfig(key: TemplateCategory): TemplateCategoryConfig {
  return (
    TEMPLATE_CATEGORIES.find((c) => c.key === key) ?? {
      key: 'custom',
      label: '自定义',
      icon: User,
      tagColor: 'default',
    }
  );
}
