import type { ReviewRecord } from '@/types/execution';

const ACTION_LABELS: Record<ReviewRecord['action'], string> = {
  approve: '通过',
  reject: '驳回',
  approve_with_modification: '修改后通过',
};

interface ReviewRecordListProps {
  records: ReviewRecord[];
}

export function ReviewRecordList({ records }: ReviewRecordListProps) {
  if (records.length === 0) {
    return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>暂无审核记录</p>;
  }

  return (
    <div className="review-record-list">
      <div className="execution-panel__section-title">审核记录</div>
      {records.map((record, index) => (
        <div key={`${record.reviewedAt}-${index}`} className="review-record-list__item">
          <div className="review-record-list__action">{ACTION_LABELS[record.action]}</div>
          {record.comment ? <div>{record.comment}</div> : null}
          <div className="review-record-list__meta">
            {new Date(record.reviewedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
