import { useCallback, useEffect, useState } from 'react';
import { BarChart, Cpu, Eye, EyeOff, Plus } from 'lucide-react';
import { ModelSupplierCard } from '@/components/models/ModelSupplierCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { Table, type Column } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { SUPPLIER_TYPE_LABELS } from '@/lib/phase2Constants';
import { asArray } from '@/lib/arrayUtils';
import { formatCost, formatTokenCount } from '@/lib/validation';
import { modelService } from '@/services/modelService';
import { handleApiError } from '@/utils/apiErrorHandler';
import { useModelListPage } from './models/hooks';
import { useModelListStore } from './models/store';
import type {
  CreateSupplierRequest,
  ModelSupplier,
  SupplierStatus,
  SupplierType,
  UsageRecord,
} from '@/types';
import { cn } from '@/lib/utils';
import '@/styles/phase2.css';
import './ModelSettingsPage.css';

const SUPPLIER_TYPES: SupplierType[] = ['openai', 'anthropic', 'google', 'custom'];

export default function ModelSettingsPage() {
  const { success } = useToast();
  const { items: suppliers, loading: isLoadingSuppliers, create, update, toggleEnabled, isEmpty } =
    useModelListPage();

  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [usageSummary, setUsageSummary] = useState({
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cost: 0,
  });
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSupplier, setEditingSupplier] = useState<ModelSupplier | null>(null);
  const [supplierType, setSupplierType] = useState<SupplierType>('openai');
  const [supplierName, setSupplierName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsage = useCallback(async () => {
    setIsLoadingUsage(true);
    try {
      const res = await modelService.getUsage();
      setUsageRecords(asArray(res?.records));
      setUsageSummary(
        res?.summary ?? {
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_cost: 0,
        },
      );
    } catch (error) {
      setUsageRecords([]);
      handleApiError(error, '加载用量统计');
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingSupplier(null);
    setSupplierType('openai');
    setSupplierName('OpenAI');
    setApiKey('');
    setBaseUrl('');
    setModalOpen(true);
  };

  const openEditModal = (supplier: ModelSupplier) => {
    setModalMode('edit');
    setEditingSupplier(supplier);
    setSupplierType(supplier.type);
    setSupplierName(supplier.name);
    setApiKey('');
    setBaseUrl(supplier.base_url ?? '');
    setModalOpen(true);
  };

  const handleSubmitSupplier = async () => {
    if (!apiKey && modalMode === 'create') {
      handleApiError(new Error('请输入 API Key'), '添加供应商');
      return;
    }
    if (supplierType === 'custom' && !supplierName.trim()) {
      handleApiError(new Error('请输入供应商名称'), '添加供应商');
      return;
    }
    if (supplierType === 'custom' && modalMode === 'create' && !baseUrl.trim()) {
      handleApiError(new Error('自定义供应商需填写 Base URL'), '添加供应商');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload: CreateSupplierRequest = {
          type: supplierType,
          name: supplierName.trim() || SUPPLIER_TYPE_LABELS[supplierType],
          api_key: apiKey,
          base_url: supplierType === 'custom' ? baseUrl : undefined,
        };
        await create(payload);
        success('供应商添加成功');
      } else if (editingSupplier) {
        await update(editingSupplier.id, {
          type: supplierType,
          name: supplierName.trim(),
          ...(apiKey ? { api_key: apiKey } : {}),
          base_url: supplierType === 'custom' ? baseUrl : undefined,
        });
        success('供应商更新成功');
      }
      setModalOpen(false);
    } catch (err) {
      handleApiError(err, '保存供应商');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: SupplierStatus) => {
    try {
      await toggleEnabled(id, currentStatus);
      success(currentStatus === 'active' ? '供应商已禁用' : '供应商已启用');
    } catch {
      /* toasted */
    }
  };

  const handleSetDefault = async (modelId: string) => {
    const prev = useModelListStore.getState().items;
    useModelListStore.setState({
      items: prev.map((sup) => ({
        ...sup,
        models: asArray<ModelSupplier['models'][number]>(sup.models).map((m) => ({
          ...m,
          is_default: m.id === modelId,
        })),
      })),
    });
    try {
      await modelService.setDefaultModel(modelId);
      success('默认模型已更新');
    } catch (err) {
      useModelListStore.setState({ items: prev });
      handleApiError(err, '设置默认模型');
    }
  };

  const usageColumns: Column<UsageRecord>[] = [
    {
      key: 'date',
      title: '日期',
      dataIndex: 'date',
      render: (v) => <span className="model-settings__mono">{String(v)}</span>,
    },
    {
      key: 'model',
      title: '模型',
      dataIndex: 'model_name',
      render: (_, record) => (
        <span>
          {record.model_name} <Tag color="default">{record.supplier_name}</Tag>
        </span>
      ),
    },
    {
      key: 'input',
      title: '输入 Token',
      dataIndex: 'input_tokens',
      render: (v) => (
        <span className="model-settings__mono model-settings__num">
          {formatTokenCount(Number(v))}
        </span>
      ),
    },
    {
      key: 'output',
      title: '输出 Token',
      dataIndex: 'output_tokens',
      render: (v) => (
        <span className="model-settings__mono model-settings__num">
          {formatTokenCount(Number(v))}
        </span>
      ),
    },
    {
      key: 'cost',
      title: '费用',
      dataIndex: 'estimated_cost',
      render: (v) => (
        <span className="model-settings__mono model-settings__cost">{formatCost(Number(v))}</span>
      ),
    },
  ];

  return (
    <div className="phase2-page">
      <div className="phase2-header">
        <div>
          <h1 className="phase2-header__title">模型管理</h1>
          <p className="phase2-header__desc">配置 AI 模型供应商、管理模型、查看用量</p>
        </div>
      </div>

      <section className="phase2-section">
        <div className="phase2-section__header">
          <h2 className="phase2-section__title">供应商</h2>
          <Button variant="secondary" size="md" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            添加供应商
          </Button>
        </div>

        {isLoadingSuppliers ? (
          <Skeleton variant="rectangular" height={200} />
        ) : isEmpty ? (
          <EmptyState
            icon={<Cpu size={48} />}
            title="暂无模型供应商"
            description="添加一个 AI 模型供应商来开始使用 Agent 能力。"
            action={{ label: '添加供应商', onClick: openCreateModal }}
          />
        ) : (
          suppliers.map((supplier) => (
            <ModelSupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={openEditModal}
              onToggleStatus={handleToggleStatus}
              onSetDefaultModel={(modelId) => void handleSetDefault(modelId)}
            />
          ))
        )}
      </section>

      <Card padding="md" className="model-settings__usage">
        <h2 className="phase2-form-section__title">用量统计（最近 7 天）</h2>
        {isLoadingUsage ? (
          <Skeleton variant="rectangular" height={200} />
        ) : usageRecords.length === 0 ? (
          <EmptyState
            icon={<BarChart size={48} />}
            title="暂无用量数据"
            description="使用 Agent 后，用量数据将在这里展示。"
          />
        ) : (
          <>
            <Table
              columns={usageColumns as unknown as Column<Record<string, unknown>>[]}
              data={usageRecords as unknown as Record<string, unknown>[]}
              rowKey={(record) => `${String(record.date)}-${String(record.model_id)}`}
            />
            <div className="model-settings__summary">
              总消耗: 输入 {formatTokenCount(usageSummary.total_input_tokens)} · 输出{' '}
              {formatTokenCount(usageSummary.total_output_tokens)} · 费用{' '}
              {formatCost(usageSummary.total_cost)}
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? '添加供应商' : '编辑供应商'}
        description="选择 AI 模型供应商并配置 API Key"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" loading={isSubmitting} onClick={() => void handleSubmitSupplier()}>
              {modalMode === 'create' ? '添加' : '保存'}
            </Button>
          </>
        }
      >
        <div className="model-settings__type-grid">
          {SUPPLIER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={cn(
                'model-settings__type-card',
                supplierType === type && 'model-settings__type-card--active',
              )}
              onClick={() => {
                setSupplierType(type);
                if (modalMode === 'create') {
                  setSupplierName(SUPPLIER_TYPE_LABELS[type]);
                }
              }}
            >
              <span className="model-settings__type-icon">
                {type === 'openai' ? '🤖' : type === 'anthropic' ? '🧠' : type === 'google' ? '🔷' : '⚙️'}
              </span>
              <span>{SUPPLIER_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>

        {(supplierType === 'custom' || modalMode === 'edit') && (
          <Input
            label="供应商名称"
            size="md"
            fullWidth
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            wrapperClassName="model-settings__modal-field"
          />
        )}

        <Input
          label="API Key *"
          size="md"
          fullWidth
          type={showApiKey ? 'text' : 'password'}
          placeholder={modalMode === 'edit' ? '留空则不修改' : 'sk-...'}
          value={apiKey}
          rightIcon={
            <button type="button" className="model-settings__eye" onClick={() => setShowApiKey((v) => !v)}>
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          onChange={(e) => setApiKey(e.target.value)}
          wrapperClassName="model-settings__modal-field"
        />

        {supplierType === 'custom' && (
          <Input
            label="Base URL"
            size="md"
            fullWidth
            prefix="https://"
            placeholder="api.example.com/v1"
            value={baseUrl.replace(/^https?:\/\//, '')}
            onChange={(e) => setBaseUrl(e.target.value)}
            wrapperClassName="model-settings__modal-field"
          />
        )}

        {modalMode === 'edit' && editingSupplier && (
          <p className="phase2-field-helper">
            当前 Key: {editingSupplier.api_key_masked}（如需修改请重新输入）
          </p>
        )}
      </Modal>
    </div>
  );
}
