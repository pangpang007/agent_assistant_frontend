import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { CopyInput } from '@/components/common/CopyInput';
import { apiService } from '@/services/apiService';
import './PublishApiModal.css';

export interface PublishApiModalProps {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
}

export function PublishApiModal({ open, onClose, workflowId, workflowName }: PublishApiModalProps) {
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [existingEndpoint, setExistingEndpoint] = useState<string | undefined>();
  const [publishResult, setPublishResult] = useState<{ endpoint: string; apiKey: string } | null>(
    null,
  );

  useEffect(() => {
    if (!open || !workflowId) return;
    let cancelled = false;
    void apiService.getByWorkflow(workflowId).then((api) => {
      if (cancelled) return;
      setIsPublished(Boolean(api));
      setExistingEndpoint(api?.endpoint);
    });
    return () => {
      cancelled = true;
    };
  }, [open, workflowId]);

  const handleClose = () => {
    setStep('confirm');
    setPublishResult(null);
    onClose();
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const result = await apiService.publish(workflowId);
      setPublishResult(result);
      setStep('success');
      setIsPublished(true);
      success('API 发布成功');
    } catch {
      toastError('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'confirm' ? '发布为 API' : 'API 发布成功'}
      size="md"
    >
      {step === 'confirm' ? (
        <div className="publish-confirm">
          <p className="publish-confirm__desc">
            将当前工作流「{workflowName}」发布为 REST API，外部系统可通过 HTTP POST 调用此工作流。
          </p>
          {isPublished && existingEndpoint && (
            <p className="publish-confirm__existing">
              该工作流已发布，重新发布会更新 Endpoint 并生成新的 API Key。
            </p>
          )}
          <div className="publish-confirm__info">
            <Info size={16} strokeWidth={1.5} />
            <div>
              <p>发布后将会生成：</p>
              <ul>
                <li>一个唯一的 Endpoint URL</li>
                <li>一个 API Key（仅首次显示完整值）</li>
                <li>外部通过 POST 请求调用，传入 JSON 参数</li>
              </ul>
            </div>
          </div>
          <div className="publish-confirm__actions">
            <Button variant="ghost" onClick={handleClose}>
              取消
            </Button>
            <Button variant="primary" loading={loading} onClick={() => void handlePublish()}>
              确认发布
            </Button>
          </div>
        </div>
      ) : (
        publishResult && (
          <div className="publish-success">
            <div className="publish-field">
              <label className="publish-field__label">Endpoint URL</label>
              <CopyInput value={publishResult.endpoint} />
            </div>
            <div className="publish-field">
              <label className="publish-field__label">API Key</label>
              <CopyInput value={publishResult.apiKey} />
              <p className="publish-field__warning">请立即复制保存，关闭后将不再显示完整 Key</p>
            </div>
            <div className="publish-field">
              <label className="publish-field__label">调用示例 (curl)</label>
              <CopyInput
                multiline
                code
                value={`curl -X POST ${publishResult.endpoint} \\\n  -H "Authorization: Bearer ${publishResult.apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "your data"}'`}
              />
            </div>
            <div className="publish-success__actions">
              <Button variant="primary" onClick={handleClose}>
                完成
              </Button>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
