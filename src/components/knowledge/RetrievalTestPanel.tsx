import { useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Spinner';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/validation';
import { knowledgeService } from '@/services/knowledgeService';
import type { RetrievalResult } from '@/types';
import { RetrievalResultCard } from './RetrievalResultCard';
import '@/styles/knowledge.css';
import '@/styles/phase2.css';
import './RetrievalTestPanel.css';

export interface RetrievalTestPanelProps {
  knowledgeBaseId: string;
}

export function RetrievalTestPanel({ knowledgeBaseId }: RetrievalTestPanelProps) {
  const { error: toastError } = useToast();
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    try {
      const res = await knowledgeService.search(knowledgeBaseId, {
        query: query.trim(),
        top_k: topK,
      });
      setResults(res.results ?? []);
      setQueryTimeMs(res.query_time_ms);
    } catch (err) {
      toastError(getApiErrorMessage(err, '检索失败'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card padding="md" className="knowledge-detail-section">
      <h2 className="knowledge-detail-section__title">检索测试</h2>

      <label className="phase2-field-label" htmlFor="retrieval-query">
        查询文本
      </label>
      <textarea
        id="retrieval-query"
        className="knowledge-textarea"
        placeholder="输入要检索的内容..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="retrieval-test__topk">
        <label className="phase2-field-label" htmlFor="retrieval-topk">
          Top-K 数量
        </label>
        <select
          id="retrieval-topk"
          className="phase2-select retrieval-test__select"
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="primary"
        size="md"
        leftIcon={<Search size={16} />}
        loading={isSearching}
        disabled={!query.trim() || isSearching}
        className="retrieval-test__submit"
        onClick={() => void handleSearch()}
      >
        {isSearching ? '检索中...' : '检索'}
      </Button>

      {isSearching && (
        <div className="retrieval-test__skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </div>
      )}

      {!isSearching && hasSearched && (
        <>
          <div className="retrieval-test__results-header">
            <span>检索结果</span>
            <Tag color="default">{results.length} 条</Tag>
            {queryTimeMs !== null && (
              <span className="retrieval-test__time">耗时 {queryTimeMs}ms</span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="retrieval-test__empty">
              <SearchX size={32} />
              <p className="retrieval-test__empty-title">未找到相关内容</p>
              <p className="retrieval-test__empty-desc">尝试更换查询词，或上传更多相关文档</p>
            </div>
          ) : (
            <div className="retrieval-test__list">
              {results.map((r) => (
                <RetrievalResultCard
                  key={`${r.rank}-${r.source_document_id}`}
                  rank={r.rank}
                  content={r.content}
                  sourceFile={r.source_file}
                  similarityScore={r.similarity_score}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
