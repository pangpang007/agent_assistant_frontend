import http from '@/lib/axios';
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
  getList: (params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
  }): Promise<KnowledgeBaseListResponse> => http.get(BASE, { params }),

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

  getDocuments: (kbId: string): Promise<DocumentListResponse> =>
    http.get(`${BASE}/${kbId}/documents`),

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

  search: (kbId: string, data: RetrievalQuery): Promise<RetrievalResponse> =>
    http.post(`${BASE}/${kbId}/search`, data),
};
