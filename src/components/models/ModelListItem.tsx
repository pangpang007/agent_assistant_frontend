import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import type { ModelInfo } from '@/types';
import './ModelListItem.css';

export interface ModelListItemProps {
  model: ModelInfo;
  isDefault: boolean;
  onSetDefault: (modelId: string) => void;
}

export function ModelListItem({ model, isDefault, onSetDefault }: ModelListItemProps) {
  return (
    <div className="model-list-item">
      <span className="model-list-item__name">{model.name}</span>
      <span className="model-list-item__price">${model.input_price_per_million.toFixed(2)}/1M</span>
      <span className="model-list-item__price">${model.output_price_per_million.toFixed(2)}/1M</span>
      <span className="model-list-item__status">{model.is_enabled ? '✓' : '—'}</span>
      <span className="model-list-item__action">
        {isDefault ? (
          <Tag color="primary">默认</Tag>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => onSetDefault(model.id)}>
            默认
          </Button>
        )}
      </span>
    </div>
  );
}
