import { useCallback, useState } from 'react';
import { LayoutTemplate, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { ListPagination } from '@/components/common/ListPagination';
import { useToast } from '@/components/ui/Toast';
import { templateService } from '@/services/templateService';
import { handleApiError } from '@/utils/apiErrorHandler';
import type { Template, TemplateCategory } from '@/types/phase6';
import { TemplateCard } from './TemplateCard';
import { TEMPLATE_CATEGORIES } from './templateCategories';
import { useTemplateListPage } from './hooks';
import '@/styles/phase2.css';
import '@/styles/phase6.css';
import './Templates.css';

export default function TemplateLibraryPage() {
  const { success } = useToast();
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    isEmpty,
    searchInput,
    source,
    category,
    navigate,
    setPage,
    handleSearchChange,
    setSource,
    setCategory,
  } = useTemplateListPage();

  const [useModal, setUseModal] = useState<{ open: boolean; template: Template | null }>({
    open: false,
    template: null,
  });
  const [workflowName, setWorkflowName] = useState('');
  const [using, setUsing] = useState(false);

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
    } catch (error) {
      handleApiError(error, '使用模板');
    } finally {
      setUsing(false);
    }
  }, [navigate, success, useModal.template, workflowName]);

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
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="phase6-source-toggle">
          {(['all', 'official', 'custom'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={source === key ? 'phase6-source-toggle--active' : ''}
              onClick={() => setSource(key)}
            >
              {key === 'all' ? '全部' : key === 'official' ? '官方' : '我的'}
            </button>
          ))}
        </div>
      </div>

      <div className="phase6-filters">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active =
            category === cat.key || (cat.key === 'all' && category === 'all');
          return (
            <button
              key={cat.key}
              type="button"
              className={`phase6-filter-pill${active ? ' phase6-filter-pill--active' : ''}`}
              onClick={() =>
                setCategory(cat.key === 'all' ? 'all' : (cat.key as TemplateCategory))
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
      ) : isEmpty ? (
        <EmptyState
          icon={<LayoutTemplate size={48} />}
          title="没有找到匹配的模板"
          description="试试调整筛选条件，或者从工作流创建自定义模板"
          action={{ label: '浏览工作流', onClick: () => navigate('/workflows') }}
        />
      ) : (
        <>
          <div className="phase6-grid">
            {items.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={openUseModal} />
            ))}
          </div>
          <ListPagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
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
