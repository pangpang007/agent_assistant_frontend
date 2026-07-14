import { Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import type { Template } from '@/types/phase6';
import { getCategoryConfig } from './templateCategories';
import './TemplateCard.css';

export interface TemplateCardProps {
  template: Template;
  onUse: (template: Template) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const category = getCategoryConfig(template.category);
  const CategoryIcon = category.icon;

  return (
    <Card hoverable padding="none" className="template-card" onClick={() => onUse(template)}>
      <div className="template-card__thumb">
        {template.thumbnail_url ? (
          <img src={template.thumbnail_url} alt={template.name} />
        ) : (
          <CategoryIcon size={48} className="template-card__thumb-icon" />
        )}
        <span className="template-card__badge">
          <Tag color={template.is_official ? 'primary' : 'default'}>
            {template.is_official ? '官方' : '自定义'}
          </Tag>
        </span>
      </div>
      <div className="template-card__body">
        <div className="template-card__title-row">
          <h3 className="template-card__title">{template.name}</h3>
          <span className="template-card__use-count">
            <Download size={12} />
            {template.use_count}
          </span>
        </div>
        <p className="template-card__desc">{template.description || '暂无描述'}</p>
        <div className="template-card__tags">
          <Tag color={category.tagColor ?? 'default'}>{category.label}</Tag>
          {template.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="default">
              {tag}
            </Tag>
          ))}
        </div>
        <div className="template-card__action">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<Play size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onUse(template);
            }}
          >
            使用模板
          </Button>
        </div>
      </div>
    </Card>
  );
}
