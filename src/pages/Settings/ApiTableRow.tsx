import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { CopyInput } from '@/components/common/CopyInput';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { formatDuration } from '@/hooks/useExecutionTimer';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';
import type { PublishedApi } from '@/types/phase7';

export interface ApiTableRowProps {
  api: PublishedApi;
  onRefresh: () => void;
}

export function ApiTableRow({ api, onRefresh }: ApiTableRowProps) {
  const { success, error: toastError } = useToast();
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  const handleToggle = async () => {
    try {
      await apiService.toggleApi(api.id, !api.enabled);
      success(api.enabled ? 'API 已停用' : 'API 已启用');
      onRefresh();
    } catch {
      toastError('操作失败');
    }
  };

  const handleResetKey = async () => {
    if (!window.confirm('重置 API Key 后，旧 Key 将立即失效。确定重置？')) return;
    try {
      const result = await apiService.resetApiKey(api.id);
      setNewApiKey(result.apiKey);
      setKeyModalOpen(true);
      success('API Key 已重置');
      onRefresh();
    } catch {
      toastError('重置失败');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除「${api.workflowName}」的 API 发布吗？此操作不可恢复。`)) {
      return;
    }
    try {
      await apiService.deleteApi(api.id);
      success('API 发布已删除');
      onRefresh();
    } catch {
      toastError('删除失败');
    }
  };

  const successRateColor =
    api.successRate >= 90
      ? 'var(--accent-success)'
      : api.successRate >= 50
        ? 'var(--accent-warning)'
        : 'var(--accent-danger)';

  return (
    <>
      <tr className={cn('api-table__row', !api.enabled && 'api-table__row--disabled')}>
        <td className="api-table__name">{api.workflowName}</td>
        <td className="api-table__endpoint">
          <CopyInput value={api.endpoint} />
        </td>
        <td>
          <code className="api-table__key">{api.apiKeyMasked}</code>
        </td>
        <td>{api.callCount.toLocaleString()}</td>
        <td>
          <span style={{ color: successRateColor }}>{api.successRate.toFixed(1)}%</span>
        </td>
        <td>{formatDuration(api.avgDurationMs)}</td>
        <td>
          <Tag color={api.enabled ? 'success' : 'default'}>{api.enabled ? '启用' : '停用'}</Tag>
        </td>
        <td>
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" leftIcon={<MoreHorizontal size={14} />} aria-label="操作">
                {' '}
              </Button>
            }
            align="right"
            items={[
              { key: 'toggle', label: api.enabled ? '停用' : '启用' },
              { key: 'reset', label: '重置 API Key' },
              { key: 'delete', label: '删除发布', danger: true, divider: true },
            ]}
            onSelect={(key) => {
              if (key === 'toggle') void handleToggle();
              if (key === 'reset') void handleResetKey();
              if (key === 'delete') void handleDelete();
            }}
          />
        </td>
      </tr>

      <Modal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title="新的 API Key"
        size="md"
      >
        <p className="api-key-modal__hint">请立即复制保存，关闭后将不再显示完整 Key</p>
        <CopyInput value={newApiKey} />
      </Modal>
    </>
  );
}
