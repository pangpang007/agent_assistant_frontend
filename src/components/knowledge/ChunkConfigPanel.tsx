import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/validation';
import { knowledgeService } from '@/services/knowledgeService';
import './ChunkConfigPanel.css';

export interface ChunkConfigPanelProps {
  knowledgeBaseId: string;
  chunkSize: number;
  chunkOverlap: number;
  onConfigSaved: (newChunkSize: number, newChunkOverlap: number) => void;
}

function ConfigSlider({
  label,
  value,
  min,
  max,
  ticks,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  ticks: number[];
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="chunk-slider">
      <div className="chunk-slider__header">
        <span className="chunk-slider__label">{label}</span>
        <span className="chunk-slider__value">{value}</span>
      </div>
      <input
        type="range"
        className="chunk-slider__input"
        min={min}
        max={max}
        step={1}
        value={value}
        style={{ '--value-pct': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="chunk-slider__ticks">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function ChunkConfigPanel({
  knowledgeBaseId,
  chunkSize: initialSize,
  chunkOverlap: initialOverlap,
  onConfigSaved,
}: ChunkConfigPanelProps) {
  const { success, error: toastError, warning } = useToast();
  const [chunkSize, setChunkSize] = useState(initialSize);
  const [chunkOverlap, setChunkOverlap] = useState(initialOverlap);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = chunkSize !== initialSize || chunkOverlap !== initialOverlap;

  const handleOverlapChange = (v: number) => {
    if (v >= chunkSize) {
      const adjusted = chunkSize - 1;
      setChunkOverlap(adjusted);
      warning('重叠大小已自动调整为小于块大小');
    } else {
      setChunkOverlap(v);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await knowledgeService.update(knowledgeBaseId, {
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      });
      success('分块配置已保存');
      onConfigSaved(chunkSize, chunkOverlap);
    } catch (err) {
      toastError(getApiErrorMessage(err, '保存失败'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="md" className="knowledge-detail-section">
      <h2 className="knowledge-detail-section__title">分块配置</h2>

      <ConfigSlider
        label="块大小 (tokens)"
        value={chunkSize}
        min={128}
        max={2048}
        ticks={[128, 512, 1024, 2048]}
        onChange={setChunkSize}
      />

      <div className="chunk-slider-spacer" />

      <ConfigSlider
        label="重叠大小 (tokens)"
        value={chunkOverlap}
        min={0}
        max={256}
        ticks={[0, 64, 128, 192, 256]}
        onChange={handleOverlapChange}
      />

      <div className="chunk-config__warning">
        <AlertTriangle size={16} />
        <span>修改配置仅对新上传的文档生效，已有文档不会重新处理</span>
      </div>

      <div className="chunk-config__actions">
        <Button variant="primary" size="md" loading={isSaving} disabled={!isDirty || isSaving} onClick={() => void handleSave()}>
          保存配置
        </Button>
      </div>
    </Card>
  );
}
