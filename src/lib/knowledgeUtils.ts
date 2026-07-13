const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.markdown', '.csv', '.docx'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 10;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return formatDate(dateStr);
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function validateKnowledgeFile(file: File): string | undefined {
  const ext = getFileExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return '不支持的文件格式，仅支持 PDF、TXT、Markdown、CSV、DOCX';
  }
  if (file.size > MAX_FILE_SIZE) {
    return '文件大小超过 50MB 限制';
  }
  return undefined;
}

export function validateKnowledgeBaseName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return '请输入知识库名称';
  if (trimmed.length > 100) return '名称不超过 100 个字符';
  return undefined;
}

export function validateKnowledgeBaseDescription(description: string): string | undefined {
  if (description.length > 500) return '描述不超过 500 个字符';
  return undefined;
}

export type FileIconKind = 'pdf' | 'csv' | 'docx' | 'text';

export function getFileIconKind(filename: string): FileIconKind {
  const ext = getFileExtension(filename);
  if (ext === '.pdf') return 'pdf';
  if (ext === '.csv') return 'csv';
  if (ext === '.docx') return 'docx';
  return 'text';
}
