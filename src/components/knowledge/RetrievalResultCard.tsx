import { useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import './RetrievalResultCard.css';

export interface RetrievalResultCardProps {
  rank: number;
  content: string;
  sourceFile: string;
  similarityScore: number;
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'var(--accent-success)';
  if (score >= 0.5) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export function RetrievalResultCard({ rank, content, sourceFile, similarityScore }: RetrievalResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const needsExpand = content.length > 300;

  return (
    <article className="retrieval-card" aria-label={`检索结果第 ${rank} 名`}>
      <div className="retrieval-card__header">
        <div className="retrieval-card__header-left">
          <span className="retrieval-card__rank">{rank}</span>
          <span className="retrieval-card__source">
            <FileText size={14} />
            <span title={sourceFile}>{sourceFile}</span>
          </span>
        </div>
        <span className="retrieval-card__score" style={{ color: getScoreColor(similarityScore) }}>
          {similarityScore.toFixed(2)}
        </span>
      </div>
      <div
        ref={contentRef}
        className={cn('retrieval-card__content', !expanded && needsExpand && 'retrieval-card__content--collapsed')}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {needsExpand && (
        <Button variant="ghost" size="sm" className="retrieval-card__toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '收起' : '展开'}
        </Button>
      )}
    </article>
  );
}
