import { ChevronDown, ChevronUp } from 'lucide-react';
import { asArray } from '@/lib/arrayUtils';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Spinner';
import { Button } from '../Button';
import './Table.css';

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  width?: string | number;
  sortable?: boolean;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
}

export type SortOrder = 'asc' | 'desc' | null;

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  sortKey?: string | null;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  pagination?:
    | {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
      }
    | false;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  className?: string;
}

function getRowKey<T>(record: T, rowKey: keyof T | ((record: T) => string)): string {
  if (typeof rowKey === 'function') return rowKey(record);
  return String(record[rowKey]);
}

function nextSortOrder(current: SortOrder): SortOrder {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  loading = false,
  sortKey = null,
  sortOrder = null,
  onSort,
  pagination = false,
  emptyText = '暂无数据',
  onRowClick,
  className,
}: TableProps<T>) {
  const rows = asArray<T>(data);
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className={cn('table-wrapper', className)}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(col.sortable && 'table__th--sortable')}
                onClick={() => {
                  if (!col.sortable || !onSort) return;
                  const order =
                    sortKey === col.key ? nextSortOrder(sortOrder) : ('asc' as SortOrder);
                  onSort(col.key, order);
                }}
              >
                <span className="table__th-content">
                  {col.title}
                  {col.sortable && (
                    <span className="table__sort-icons">
                      <ChevronUp
                        size={12}
                        className={cn(
                          sortKey === col.key && sortOrder === 'asc' && 'table__sort-active',
                        )}
                      />
                      <ChevronDown
                        size={12}
                        className={cn(
                          sortKey === col.key && sortOrder === 'desc' && 'table__sort-active',
                        )}
                      />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <Skeleton variant="text" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((record, index) => (
              <tr
                key={getRowKey(record, rowKey)}
                className={cn(onRowClick && 'table__row--clickable')}
                onClick={() => onRowClick?.(record)}
              >
                {columns.map((col) => {
                  const value = record[col.dataIndex];
                  return (
                    <td key={col.key}>
                      {col.render ? col.render(value, record, index) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && (
        <div className="table__pagination">
          <span>
            第 {pagination.current} 页 / 共 {totalPages} 页
          </span>
          <div className="table__pagination-actions">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current >= totalPages}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
