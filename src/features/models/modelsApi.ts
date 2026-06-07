import { api } from '@/lib/api';
import type { ModelsResponse } from '@/features/models/types';

export const modelsApi = {
  list: () => api.get<ModelsResponse>('/models').then((r) => r.data),
  select: (model: string) =>
    api.post<{ current: string }>('/models/select', { model }).then((r) => r.data),
};
