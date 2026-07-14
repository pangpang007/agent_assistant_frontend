import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { templateService } from '@/services/templateService';
import type { TemplateCategory } from '@/types/phase6';
import { SAVE_TEMPLATE_CATEGORIES } from './templateCategories';
import '@/styles/phase6.css';
import './Templates.css';

export interface SaveAsTemplateModalProps {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  defaultName?: string;
}

export function SaveAsTemplateModal({
  open,
  onClose,
  workflowId,
  defaultName = '',
}: SaveAsTemplateModalProps) {
  const { success, error: toastError } = useToast();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDescription('');
      setCategory('custom');
      setTags([]);
      setTagInput('');
      setErrors({});
    }
  }, [open, defaultName]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.length >= 5 || tags.includes(trimmed)) return;
    if (trimmed.length > 20) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = '请输入模板名称';
    else if (name.trim().length > 50) nextErrors.name = '名称最多 50 个字符';
    if (!category) nextErrors.category = '请选择分类';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await templateService.saveAsTemplate({
        workflow_id: workflowId,
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
      });
      success('模板保存成功');
      onClose();
    } catch {
      toastError('保存模板失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="另存为模板"
      description="将当前工作流保存为可复用的模板。"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button variant="primary" loading={submitting} onClick={() => void handleSubmit()}>
            保存模板
          </Button>
        </>
      }
    >
      <div className="phase6-form-stack">
        <div>
          <label className="phase6-form-label">模板名称 *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入模板名称"
            error={errors.name}
          />
        </div>
        <div>
          <label className="phase6-form-label">描述</label>
          <textarea
            className="phase6-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要描述模板用途"
            rows={3}
            maxLength={200}
          />
        </div>
        <div>
          <label className="phase6-form-label">分类 *</label>
          <select
            className="phase2-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
          >
            {SAVE_TEMPLATE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category ? <span className="phase6-form-error">{errors.category}</span> : null}
        </div>
        <div>
          <label className="phase6-form-label">标签</label>
          <div className="phase6-tag-input">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="输入标签后按 Enter"
              disabled={tags.length >= 5}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <div className="phase6-tag-input__tags">
              {tags.map((tag) => (
                <Tag key={tag} closable onClose={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
        <p className="phase6-form-hint">
          模板将包含当前工作流的所有节点和连线配置，但不包含执行数据和环境变量值。
        </p>
      </div>
    </Modal>
  );
}
