import http from '@/lib/axios';
import { pickList } from '@/lib/arrayUtils';
import type {
  CreateKnowledgeBaseRequest,
  DocumentListResponse,
  KnowledgeBase,
  KnowledgeBaseListResponse,
  KnowledgeDocument,
  RetrievalQuery,
  RetrievalResponse,
  UpdateKnowledgeBaseRequest,
} from '@/types';

const BASE = '/knowledge';

export const knowledgeService = {
  getList: async (params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
  }): Promise<KnowledgeBaseListResponse> => {
    const res = await http.get(BASE, { params });
    const knowledge_bases = pickList<KnowledgeBase>(res, [
      'knowledge_bases',
      'items',
      'results',
    ]);
    const total =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { total?: number }).total ?? knowledge_bases.length)
        : knowledge_bases.length;
    return { knowledge_bases, total };
  },

  getById: (id: string): Promise<KnowledgeBase> => http.get(`${BASE}/${id}`),

  create: (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> =>
    http.post(BASE, data),

  update: (id: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
    const { chunk_size, chunk_overlap, ...rest } = data;
    if (chunk_size !== undefined || chunk_overlap !== undefined) {
      return http.put(`${BASE}/${id}/config`, {
        chunk_size,
        chunk_overlap,
      });
    }
    return http.put(`${BASE}/${id}`, rest);
  },

  delete: (id: string): Promise<void> => http.delete(`${BASE}/${id}`),

  getDocuments: async (kbId: string): Promise<DocumentListResponse> => {
    const res = await http.get(`${BASE}/${kbId}/documents`);
    const documents = pickList<KnowledgeDocument>(res, [
      'documents',
      'items',
      'results',
    ]);
    const total =
      res && typeof res === 'object' && !Array.isArray(res)
        ? Number((res as { total?: number }).total ?? documents.length)
        : documents.length;
    return { documents, total };
  },

  getDocument: (kbId: string, docId: string): Promise<KnowledgeDocument> =>
    http.get(`${BASE}/${kbId}/documents/${docId}/status`),

  uploadDocument: (
    kbId: string,
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`${BASE}/${kbId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },

  deleteDocument: (kbId: string, docId: string): Promise<void> =>
    http.delete(`${BASE}/${kbId}/documents/${docId}`),

  reprocessDocument: (kbId: string, docId: string): Promise<KnowledgeDocument> =>
    http.post(`${BASE}/${kbId}/documents/${docId}/reprocess`),

  search: async (kbId: string, data: RetrievalQuery): Promise<RetrievalResponse> => {
    const res = await http.post(`${BASE}/${kbId}/search`, data);
    const results = pickList<RetrievalResponse['results'][number]>(res, [
      'results',
      'items',
      'documents',
    ]);
    const obj =
      res && typeof res === 'object' && !Array.isArray(res)
        ? (res as { total_found?: number; query_time_ms?: number })
        : {};
    return {
      results,
      total_found: Number(obj.total_found ?? results.length),
      query_time_ms: Number(obj.query_time_ms ?? 0),
    };
  },
};
