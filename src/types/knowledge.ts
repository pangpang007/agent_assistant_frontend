export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  document_count: number;
  total_size: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface KnowledgeDocument {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_size: number;
  chunk_count: number | null;
  status: DocumentStatus;
  error_message?: string;
  created_at: string;
}

export interface RetrievalQuery {
  query: string;
  top_k: number;
}

export interface RetrievalResult {
  rank: number;
  content: string;
  source_file: string;
  source_document_id: string;
  similarity_score: number;
}

export interface RetrievalResponse {
  results: RetrievalResult[];
  total_found: number;
  query_time_ms: number;
}

export interface KnowledgeBaseListResponse {
  knowledge_bases: KnowledgeBase[];
  total: number;
}

export interface DocumentListResponse {
  documents: KnowledgeDocument[];
  total: number;
}
