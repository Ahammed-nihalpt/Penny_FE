import { api } from '@/lib/api';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceDraft,
  InvoiceFilter,
  UpdateInvoiceInput,
} from '@/features/invoices/types';

export const invoicesApi = {
  list: (filter: InvoiceFilter, search: string) =>
    api
      .get<Invoice[]>('/invoices', { params: { filter, search: search || undefined } })
      .then((r) => r.data),
  create: (input: CreateInvoiceInput) => api.post<Invoice>('/invoices', input).then((r) => r.data),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<InvoiceDraft>('/invoices/upload', fd).then((r) => r.data);
  },
  update: (id: string, input: UpdateInvoiceInput) =>
    api.patch<Invoice>(`/invoices/${id}`, input).then((r) => r.data),
  markPaid: (id: string) => api.post<Invoice>(`/invoices/${id}/pay`).then((r) => r.data),
  remove: (id: string) => api.delete(`/invoices/${id}`).then((r) => r.data),
};
