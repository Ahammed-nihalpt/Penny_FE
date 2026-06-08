export const INVOICE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Supplies',
  'Services',
  'Software',
  'Travel',
  'Taxes',
  'Other',
] as const;
export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number];

export type InvoiceFilter = 'all' | 'overdue' | 'due' | 'paid';

export interface Invoice {
  _id: string;
  vendor: string;
  invoiceNumber?: string;
  email?: string;
  amount: number;
  category: InvoiceCategory;
  dueDate: string;
  issuedDate?: string;
  notes?: string;
  status: 'open' | 'paid';
  createdAt: string;
}

export interface CreateInvoiceInput {
  vendor: string;
  invoiceNumber?: string;
  email?: string;
  amount: number;
  category: InvoiceCategory;
  dueDate: string;
  issuedDate?: string;
  notes?: string;
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

export interface InvoiceDraft {
  vendor: string;
  invoiceNumber?: string;
  email?: string;
  amount: number;
  category: InvoiceCategory;
  dueDate: string;
  issuedDate?: string;
  notes?: string;
  sourceFile?: string;
}
