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
  email?: string;
  amount: number;
  currency: string;
  category: InvoiceCategory;
  dueDate: string;
  issuedDate?: string;
  status: 'open' | 'paid';
  createdAt: string;
}

export interface CreateInvoiceInput {
  vendor: string;
  email?: string;
  amount: number;
  category: InvoiceCategory;
  dueDate: string;
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;
