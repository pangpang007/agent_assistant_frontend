import { useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { VersionRecord } from '@/types/phase6';

export interface VersionListItemProps {
  version: VersionRecord;
  isCurrent?: boolean;
  selected?: boolean;
  compareMode?: boolean;
  compareSelected?: boolean;
  onPreview: (version: VersionRecord) => void;
  onCompare: (version: VersionRecord) => void;
  onRollback: (version: VersionRecord) => void;
  onTagSave: (version: VersionRecord, tag: string | null) => void;
  onCompareSelect?: (version: VersionRecord) => void;
}

export function VersionListItem({
  version,
  isCurrent,
  selected,
  compareMode,
  compareSelected,
  onPreview,
  onCompare,
  onRollback,
  onTagSave,
  onCompareSelect,
}: VersionListItemProps) {
  const [editingTag, setEditingTag] = useState(false);
  const [tagValue, setTagValue] = useState(version.tag ?? '');

  const relativeTime = version.created_at
    ? formatDistanceToNow(parseISO(version.created_at), { addSuffix: true, locale: zhCN })
    : '';

  const saveTag = () => {
    onTagSave(version, tagValue.trim() || null);
    setEditingTag(false);
  };

  return (
    <div
      className={`version-list-item${selected ? ' version-list-item--selected' : ''}`}
      onClick={() => compareMode && onCompareSelect?.(version)}
    >
      <div className="version-list-item__row">
        <span className="version-list-item__version">
          {compareMode ? (
            <input
              type="checkbox"
              checked={compareSelected}
              readOnly
              style={{ marginRight: 8 }}
            />
          ) : null}
          v{version.version_number}
          {isCurrent ? ' (当前)' : ''}
        </span>
        <span className="version-list-item__time">{relativeTime}</span>
      </div>
      {version.created_at ? (
        <div className="version-list-item__time">
          {format(parseISO(version.created_at), 'yyyy-MM-dd HH:mm:ss')}
        </div>
      ) : null}

      {editingTag ? (
        <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-1)' }}>
          <Input
            size="sm"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            placeholder="输入标签，如：上线版"
          />
          <Button size="sm" variant="primary" onClick={saveTag}>
            保存
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingTag(false)}>
            取消
          </Button>
        </div>
      ) : (
        <div className="version-list-item__tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {version.tag ? `「${version.tag}」` : '无标签'}
          <button
            type="button"
            className="modal__close"
            style={{ padding: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              setTagValue(version.tag ?? '');
              setEditingTag(true);
            }}
            aria-label="编辑标签"
          >
            <Pencil size={12} />
          </button>
        </div>
      )}

      {!compareMode ? (
        <div className="version-list-item__actions">
          <Button size="sm" variant="ghost" onClick={() => onPreview(version)}>
            预览
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCompare(version)}>
            对比
          </Button>
          {!isCurrent ? (
            <Button size="sm" variant="ghost" onClick={() => onRollback(version)}>
              回滚
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
