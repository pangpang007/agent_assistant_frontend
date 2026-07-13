import { useRef, useState } from 'react';
import { FileJson, FileSearch, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/validation';
import { toolService } from '@/services/toolService';
import type { SwaggerParseResult } from '@/types';
import { cn } from '@/lib/utils';
import './SwaggerImporter.css';

export interface SwaggerImporterProps {
  onParsed: (data: SwaggerParseResult) => void;
  isLoading?: boolean;
}

type ImportTab = 'paste' | 'upload';

export function SwaggerImporter({ onParsed, isLoading = false }: SwaggerImporterProps) {
  const [tab, setTab] = useState<ImportTab>('paste');
  const [jsonText, setJsonText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  const parseJson = async (text: string) => {
    if (!text.trim()) {
      toastError('请先粘贴或上传 OpenAPI JSON');
      return;
    }
    setParsing(true);
    try {
      const result = await toolService.parseSwagger(text);
      onParsed(result);
      success('解析成功，已填充工具信息');
    } catch (err) {
      toastError(getApiErrorMessage(err, 'JSON 格式不正确或不是有效的 OpenAPI 规范'));
    } finally {
      setParsing(false);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setJsonText(text);
      void parseJson(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="swagger-importer">
      <div className="swagger-importer__tabs">
        <button
          type="button"
          className={cn('swagger-importer__tab', tab === 'paste' && 'swagger-importer__tab--active')}
          onClick={() => setTab('paste')}
        >
          <FileJson size={16} /> 粘贴 JSON
        </button>
        <button
          type="button"
          className={cn('swagger-importer__tab', tab === 'upload' && 'swagger-importer__tab--active')}
          onClick={() => setTab('upload')}
        >
          <Upload size={16} /> 上传文件
        </button>
      </div>

      {tab === 'paste' ? (
        <div>
          <textarea
            className="phase2-textarea"
            placeholder="粘贴 OpenAPI 3.0 或 Swagger 2.0 JSON 规范..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <div className="swagger-importer__parse-row">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileSearch size={14} />}
              loading={parsing || isLoading}
              onClick={() => void parseJson(jsonText)}
            >
              解析
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn('swagger-importer__dropzone', dragOver && 'swagger-importer__dropzone--active')}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={48} className="swagger-importer__drop-icon" />
          <p>拖拽 JSON 文件到此处，或点击选择文件</p>
          <p className="swagger-importer__drop-hint">支持 .json, .yaml 格式</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.yaml,.yml"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
