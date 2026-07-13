import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { formatCost, getApiErrorMessage } from '@/lib/validation';
import { toolService } from '@/services/toolService';
import type { Tool, ToolTestResponse } from '@/types';
import '@/styles/phase2.css';
import './ToolTestPage.css';

export default function ToolTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [tool, setTool] = useState<Tool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [response, setResponse] = useState<ToolTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const data = await toolService.getById(id);
        setTool(data);
        const initial: Record<string, string> = {};
        data.parameters.forEach((p) => {
          initial[p.name] = p.default_value ?? '';
        });
        setParams(initial);
      } catch {
        toastError('工具不存在');
        navigate('/tools', { replace: true });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate, toastError]);

  const handleTest = async () => {
    if (!id) return;
    setIsTesting(true);
    setError(null);
    setResponse(null);
    try {
      const res = await toolService.testTool(id, { params });
      setResponse(res);
    } catch (err) {
      setError(getApiErrorMessage(err, '请求失败'));
    } finally {
      setIsTesting(false);
    }
  };

  const statusTagColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success' as const;
    if (status >= 400 && status < 500) return 'warning' as const;
    return 'danger' as const;
  };

  if (isLoading) {
    return (
      <div className="phase2-page">
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!tool) return null;

  return (
    <div className="phase2-page">
      <button type="button" className="phase2-back" onClick={() => navigate('/tools')}>
        <ArrowLeft size={16} /> 返回工具列表
      </button>

      <h1 className="phase2-header__title">测试工具：{tool.name}</h1>
      <p className="phase2-header__desc">{tool.description}</p>

      <div className="phase2-test-grid">
        <Card padding="md" className="tool-test__panel">
          <h2 className="tool-test__title">请求参数</h2>
          {tool.parameters.map((param) => (
            <div key={param.name} className="tool-test__param-row">
              <label className="tool-test__param-label">
                {param.name}
                {param.required && <span className="tool-test__required">*</span>}
                <span className="tool-test__param-type">{param.type}</span>
              </label>
              <Input
                size="md"
                fullWidth
                value={params[param.name] ?? ''}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                }
              />
            </div>
          ))}
          <Button
            variant="primary"
            leftIcon={<Send size={16} />}
            loading={isTesting}
            disabled={isTesting}
            onClick={() => void handleTest()}
            className="tool-test__submit"
          >
            发送请求
          </Button>
        </Card>

        <Card padding="md" className="tool-test__panel">
          <h2 className="tool-test__title">响应结果</h2>
          {isTesting ? (
            <Skeleton variant="rectangular" height={300} />
          ) : !response && !error ? (
            <div className="tool-test__empty">
              <Send size={32} />
              <p>填写左侧参数后点击发送请求</p>
            </div>
          ) : error ? (
            <p className="tool-test__error">{error}</p>
          ) : response ? (
            <>
              <div className="tool-test__status-row">
                <Tag color={statusTagColor(response.status)}>
                  {response.status} {response.status_text}
                </Tag>
                <span className="tool-test__duration">耗时: {response.duration_ms}ms</span>
              </div>
              <pre className="tool-test__body">
                {JSON.stringify(response.data, null, 2)}
              </pre>
              <button
                type="button"
                className="tool-test__details-toggle"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                请求详情
              </button>
              {showDetails && (
                <div className="tool-test__details">
                  <p>
                    {response.request_details.method} {response.request_details.url}
                  </p>
                  <pre>{JSON.stringify(response.request_details.headers, null, 2)}</pre>
                  {response.token_usage !== undefined && (
                    <p>Token 消耗: {response.token_usage}</p>
                  )}
                  {response.estimated_cost !== undefined && (
                    <p>费用: {formatCost(response.estimated_cost)}</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
