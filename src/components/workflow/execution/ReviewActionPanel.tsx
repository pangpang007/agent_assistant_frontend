import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { executionService } from '@/services/executionService';
import type { ReviewAction, WSReviewActionMessage } from '@/types/execution';
import { ReviewRecordList } from './ReviewRecordList';
import type { ReviewRecord } from '@/types/execution';

interface ReviewActionPanelProps {
  executionId: string;
  nodeId: string;
  inputData: Record<string, unknown> | null;
  description: string | null;
  reviewRecords: ReviewRecord[];
  sendReview: (message: WSReviewActionMessage) => void;
}

export function ReviewActionPanel({
  executionId,
  nodeId,
  inputData,
  description,
  reviewRecords,
  sendReview,
}: ReviewActionPanelProps) {
  const { success, error: toastError } = useToast();
  const [comment, setComment] = useState('');
  const [modifying, setModifying] = useState(false);
  const [modifiedJson, setModifiedJson] = useState('');
  const [loading, setLoading] = useState(false);

  const outputPreview = inputData != null ? JSON.stringify(inputData, null, 2) : '—';

  const submit = async (action: ReviewAction, modifiedOutput?: Record<string, unknown>) => {
    setLoading(true);
    try {
      await executionService.submitReview(executionId, {
        nodeId,
        action,
        comment: comment.trim() || undefined,
        modifiedOutput,
      });
      sendReview({
        type: 'review_action',
        data: {
          executionId,
          nodeId,
          action,
          comment: comment.trim() || undefined,
          modifiedOutput,
        },
      });
      success('审核操作已提交');
      setModifying(false);
      setComment('');
    } catch {
      toastError('审核提交失败');
    } finally {
      setLoading(false);
    }
  };

  const startModify = () => {
    setModifiedJson(outputPreview);
    setModifying(true);
  };

  const confirmModify = () => {
    try {
      const parsed = JSON.parse(modifiedJson) as Record<string, unknown>;
      void submit('approve_with_modification', parsed);
    } catch (e) {
      toastError(`JSON 格式错误：${e instanceof Error ? e.message : '无效 JSON'}`);
    }
  };

  return (
    <div className="review-action-panel">
      {description ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{description}</p>
      ) : null}

      <div>
        <div className="execution-panel__section-title">审核内容</div>
        {modifying ? (
          <textarea
            className="review-action-panel__textarea"
            value={modifiedJson}
            onChange={(e) => setModifiedJson(e.target.value)}
            rows={8}
          />
        ) : (
          <div className="review-action-panel__content">
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{outputPreview}</pre>
          </div>
        )}
      </div>

      <div>
        <div className="execution-panel__section-title">审核意见（可选）</div>
        <textarea
          className="review-action-panel__textarea"
          placeholder="输入审核意见..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      <div className="review-action-panel__actions">
        {modifying ? (
          <>
            <Button variant="primary" size="sm" loading={loading} onClick={confirmModify}>
              确认修改并通过
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setModifying(false)} disabled={loading}>
              取消
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="sm" loading={loading} onClick={() => void submit('approve')}>
              通过
            </Button>
            <Button variant="danger" size="sm" loading={loading} onClick={() => void submit('reject')}>
              驳回
            </Button>
            <Button variant="secondary" size="sm" loading={loading} onClick={startModify}>
              修改后通过
            </Button>
          </>
        )}
      </div>

      <ReviewRecordList records={reviewRecords} />
    </div>
  );
}
