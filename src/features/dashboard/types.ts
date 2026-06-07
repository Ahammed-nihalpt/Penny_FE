export interface InvoiceSummary {
  outstanding: number;
  overdue: { total: number; count: number };
  dueThisWeek: number;
  paidThisMonth: number;
  byCategory: { category: string; total: number }[];
  overTime: { month: string; open: number; paid: number }[];
  topVendors: { vendor: string; total: number }[];
}
