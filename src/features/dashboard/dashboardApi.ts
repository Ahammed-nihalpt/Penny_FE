import { api } from '@/lib/api';
import type { InvoiceSummary } from '@/features/dashboard/types';

export const dashboardApi = {
  summary: () => api.get<InvoiceSummary>('/invoices/summary').then((r) => r.data),
};
