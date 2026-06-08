import { create } from 'zustand';
import { notifications } from '@mantine/notifications';
import { invoicesApi } from '@/features/invoices/invoicesApi';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceFilter,
  UpdateInvoiceInput,
} from '@/features/invoices/types';

interface InvoicesStore {
  invoices: Invoice[];
  filter: InvoiceFilter;
  search: string;
  loading: boolean;
  setFilter: (filter: InvoiceFilter) => void;
  setSearch: (search: string) => void;
  load: () => Promise<void>;
  create: (input: CreateInvoiceInput) => Promise<void>;
  update: (id: string, input: UpdateInvoiceInput) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useInvoicesStore = create<InvoicesStore>((set, get) => ({
  invoices: [],
  filter: 'all',
  search: '',
  loading: false,

  setFilter: (filter) => {
    set({ filter });
    void get().load();
  },

  setSearch: (search) => {
    set({ search });
  },

  load: async () => {
    set({ loading: true });
    try {
      const invoices = await invoicesApi.list(get().filter, get().search);
      set({ invoices });
    } catch {
      notifications.show({ color: 'red', message: 'Couldn’t load your invoices.' });
    } finally {
      set({ loading: false });
    }
  },

  create: async (input) => {
    await invoicesApi.create(input);
    await get().load();
  },

  update: async (id, input) => {
    await invoicesApi.update(id, input);
    await get().load();
  },

  markPaid: async (id) => {
    await invoicesApi.markPaid(id);
    await get().load();
  },

  remove: async (id) => {
    await invoicesApi.remove(id);
    await get().load();
  },
}));
