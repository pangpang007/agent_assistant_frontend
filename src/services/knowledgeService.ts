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

export const knowledgeService = {
  getList: (): Promise<KnowledgeBaseListResponse> => http.get('/knowledge-bases'),

  getById: (id: string): Promise<KnowledgeBase> => http.get(`/knowledge-bases/${id}`),

  create: (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> =>
    http.post('/knowledge-bases', data),

  update: (id: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> =>
    http.put(`/knowledge-bases/${id}`, data),

  delete: (id: string): Promise<void> => http.delete(`/knowledge-bases/${id}`),

  getDocuments: (kbId: string): Promise<DocumentListResponse> =>
    http.get(`/knowledge-bases/${kbId}/documents`),

  getDocument: (kbId: string, docId: string): Promise<KnowledgeDocument> =>
    http.get(`/knowledge-bases/${kbId}/documents/${docId}`),

  uploadDocument: (
    kbId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/knowledge-bases/${kbId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
  },

  deleteDocument: (kbId: string, docId: string): Promise<void> =>
    http.delete(`/knowledge-bases/${kbId}/documents/${docId}`),

  reprocessDocument: (kbId: string, docId: string): Promise<KnowledgeDocument> =>
    http.post(`/knowledge-bases/${kbId}/documents/${docId}/reprocess`),

  search: (kbId: string, data: RetrievalQuery): Promise<RetrievalResponse> =>
    http.post(`/knowledge-bases/${kbId}/search`, data),
};
