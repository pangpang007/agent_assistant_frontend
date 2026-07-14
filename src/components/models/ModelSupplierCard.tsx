import { CheckCircle, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ModelInfo, ModelSupplier, SupplierStatus } from '@/types';
import { ModelListItem } from './ModelListItem';
import './ModelSupplierCard.css';

export interface ModelSupplierCardProps {
  supplier: ModelSupplier;
  onEdit: (supplier: ModelSupplier) => void;
  onToggleStatus: (id: string, currentStatus: SupplierStatus) => void;
  onSetDefaultModel: (modelId: string) => void;
}

export function ModelSupplierCard({
  supplier,
  onEdit,
  onToggleStatus,
  onSetDefaultModel,
}: ModelSupplierCardProps) {
  const isActive = supplier.status === 'active';
  const models = Array.isArray(supplier.models) ? supplier.models : [];

  return (
    <Card padding="md" className="model-supplier-card">
      <div className="model-supplier-card__header">
        <div className="model-supplier-card__title-row">
          <span className="model-supplier-card__name">{supplier.name}</span>
          <span
            className={`model-supplier-card__status-dot ${isActive ? 'model-supplier-card__status-dot--active' : ''}`}
          />
          <span className="model-supplier-card__status-text">{isActive ? '已启用' : '已禁用'}</span>
        </div>
        <div className="model-supplier-card__actions">
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => onEdit(supplier)}>
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
            onClick={() => onToggleStatus(supplier.id, supplier.status)}
          >
            {isActive ? '禁用' : '启用'}
          </Button>
        </div>
      </div>

      <div className="model-supplier-card__meta">
        <span>API Key: {supplier.api_key_masked}</span>
        {supplier.base_url && <span>Base URL: {supplier.base_url}</span>}
      </div>

      {!isActive && (
        <p className="model-supplier-card__disabled-hint">已禁用，模型不可用</p>
      )}

      {isActive && models.length > 0 && (
        <>
          <div className="model-supplier-card__divider" />
          <h4 className="model-supplier-card__models-title">模型列表</h4>
          <div className="model-supplier-card__models-header">
            <span>模型名称</span>
            <span>输入价格</span>
            <span>输出价格</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {models.map((model: ModelInfo) => (
            <ModelListItem
              key={model.id}
              model={model}
              isDefault={model.is_default}
              onSetDefault={onSetDefaultModel}
            />
          ))}
        </>
      )}

      {isActive && models.length === 0 && (
        <p className="model-supplier-card__empty">
          <CheckCircle size={14} /> 暂无模型数据
        </p>
      )}
    </Card>
  );
}
