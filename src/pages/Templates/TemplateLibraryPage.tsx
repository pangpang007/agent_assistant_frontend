import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { templateService } from '@/services/templateService';
import { useTemplateStore } from '@/stores/templateStore';
import type { Template, TemplateCategory } from '@/types/phase6';
import { TemplateCard } from './TemplateCard';
import { TEMPLATE_CATEGORIES } from './templateCategories';
import '@/styles/phase2.css';
import '@/styles/phase6.css';
import './Templates.css';

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const templates = useTemplateStore((s) => s.templates);
  const loading = useTemplateStore((s) => s.loading);
  const filters = useTemplateStore((s) => s.filters);
  const setFilter = useTemplateStore((s) => s.setFilter);
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [useModal, setUseModal] = useState<{ open: boolean; template: Template | null }>({
    open: false,
    template: null,
  });
  const [workflowName, setWorkflowName] = useState('');
  const [using, setUsing] = useState(false);

  useEffect(() => {
    setFilter({ keyword: debouncedSearch });
  }, [debouncedSearch, setFilter]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates, filters.category, filters.source]);

  const filteredTemplates = useMemo(() => {
    const list = templates ?? [];
    if (!debouncedSearch) return list;
    const q = debouncedSearch.toLowerCase();
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [templates, debouncedSearch]);

  const openUseModal = (template: Template) => {
    setUseModal({ open: true, template });
    setWorkflowName(`${template.name} (副本)`);
  };

  const handleUseTemplate = useCallback(async () => {
    if (!useModal.template) return;
    setUsing(true);
    try {
      const res = await templateService.useTemplate(useModal.template.id, workflowName.trim());
      if (!res.workflow_id) throw new Error('missing workflow id');
      success('工作流创建成功');
      setUseModal({ open: false, template: null });
      navigate(`/workflows/${res.workflow_id}`);
    } catch {
      toastError('创建失败，请重试');
    } finally {
      setUsing(false);
    }
  }, [navigate, success, toastError, useModal.template, workflowName]);

  return (
    <div className="phase2-page">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">模板库</h1>
          <p className="phase2-header__desc">从模板快速创建工作流，或浏览官方推荐方案</p>
        </div>
      </div>

      <div className="phase2-toolbar">
        <div className="phase2-toolbar__search">
          <Input
            size="md"
            fullWidth
            leftIcon={<Search size={16} />}
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="phase6-source-toggle">
          {(['all', 'official', 'custom'] as const).map((source) => (
            <button
              key={source}
              type="button"
              className={filters.source === source ? 'phase6-source-toggle--active' : ''}
              onClick={() => setFilter({ source })}
            >
              {source === 'all' ? '全部' : source === 'official' ? '官方' : '我的'}
            </button>
          ))}
        </div>
      </div>

      <div className="phase6-filters">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active =
            filters.category === cat.key || (cat.key === 'all' && filters.category === 'all');
          return (
            <button
              key={cat.key}
              type="button"
              className={`phase6-filter-pill${active ? ' phase6-filter-pill--active' : ''}`}
              onClick={() =>
                setFilter({ category: cat.key === 'all' ? 'all' : (cat.key as TemplateCategory) })
              }
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="phase6-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={320} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate size={48} />}
          title="没有找到匹配的模板"
          description="试试调整筛选条件，或者从工作流创建自定义模板"
          action={{ label: '浏览工作流', onClick: () => navigate('/workflows') }}
        />
      ) : (
        <div className="phase6-grid">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={openUseModal} />
          ))}
        </div>
      )}

      <Modal
        open={useModal.open}
        onClose={() => setUseModal({ open: false, template: null })}
        title="使用模板"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUseModal({ open: false, template: null })}>
              取消
            </Button>
            <Button variant="primary" loading={using} onClick={() => void handleUseTemplate()}>
              确认创建
            </Button>
          </>
        }
      >
        {useModal.template ? (
          <div className="phase6-form-stack">
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              将基于「{useModal.template.name}」模板创建一个新的工作流副本，你可以在编辑器中自由修改。
            </p>
            <div>
              <label className="phase6-form-label">工作流名称</label>
              <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
