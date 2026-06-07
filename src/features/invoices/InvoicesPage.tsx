import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Badge,
  Button,
  Container,
  FileButton,
  Group,
  SegmentedControl,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import { useInvoicesStore } from '@/features/invoices/invoicesStore';
import { invoicesApi } from '@/features/invoices/invoicesApi';
import { InvoiceFormModal } from '@/features/invoices/InvoiceFormModal';
import type { CreateInvoiceInput, Invoice, InvoiceFilter } from '@/features/invoices/types';

const FILTERS: { label: string; value: InvoiceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due', value: 'due' },
  { label: 'Paid', value: 'paid' },
];

export function InvoicesPage() {
  const invoices = useInvoicesStore((s) => s.invoices);
  const filter = useInvoicesStore((s) => s.filter);
  const loading = useInvoicesStore((s) => s.loading);
  const setFilter = useInvoicesStore((s) => s.setFilter);
  const setSearch = useInvoicesStore((s) => s.setSearch);
  const load = useInvoicesStore((s) => s.load);
  const markPaid = useInvoicesStore((s) => s.markPaid);
  const remove = useInvoicesStore((s) => s.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [prefill, setPrefill] = useState<Partial<CreateInvoiceInput> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearch(debouncedSearch);
    void load();
  }, [debouncedSearch, setSearch, load]);

  const handleExport = async () => {
    try {
      const res = await api.get('/invoices/export', { params: { filter }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifications.show({ color: 'red', message: 'Export failed' });
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaid(id)
      .then(() => notifications.show({ color: 'teal', message: 'Marked as paid' }))
      .catch(() => notifications.show({ color: 'red', message: 'Could not update' }));
  };

  const openModal = () => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    setPrefill(null);
    openModal();
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setPrefill(null);
    openModal();
  };

  const handleUpload = (file: File | null) => {
    if (!file) return;
    setUploading(true);
    invoicesApi
      .upload(file)
      .then((draft) => {
        setEditing(null);
        setPrefill(draft);
        openModal();
      })
      .catch((err: unknown) => {
        const status = err instanceof AxiosError ? err.response?.status : undefined;
        const message =
          status === 503
            ? 'Vision is not configured (set GEMINI_API_KEY on the server)'
            : status === 422
              ? "Couldn't read this invoice — try a clearer photo or add it manually"
              : 'Upload failed';
        notifications.show({ color: 'red', message });
      })
      .finally(() => setUploading(false));
  };

  const handleDelete = (inv: Invoice) => {
    if (!window.confirm(`Delete the invoice from ${inv.vendor}?`)) return;
    remove(inv._id)
      .then(() => notifications.show({ color: 'teal', message: 'Invoice deleted' }))
      .catch(() => notifications.show({ color: 'red', message: 'Could not delete' }));
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Invoices</Title>
        <Group>
          <Anchor component={Link} to="/" size="sm">
            Home
          </Anchor>
          <Button variant="default" onClick={() => void handleExport()}>
            Export CSV
          </Button>
          <FileButton
            onChange={handleUpload}
            accept="image/png,image/jpeg,image/webp,application/pdf"
          >
            {(props) => (
              <Button {...props} variant="light" loading={uploading}>
                Upload invoice
              </Button>
            )}
          </FileButton>
          <Button onClick={openAdd}>Add invoice</Button>
        </Group>
      </Group>

      <Group justify="space-between" mb="md">
        <SegmentedControl
          data={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v as InvoiceFilter)}
        />
        <TextInput
          placeholder="Search vendor…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.currentTarget.value)}
        />
      </Group>

      {invoices.length === 0 && !loading ? (
        <Text c="dimmed" ta="center" py="xl">
          No invoices yet. Add one to get started.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Vendor</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Due date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invoices.map((inv) => (
              <Table.Tr key={inv._id}>
                <Table.Td>{inv.vendor}</Table.Td>
                <Table.Td>{inv.amount.toFixed(2)}</Table.Td>
                <Table.Td>{inv.category}</Table.Td>
                <Table.Td>{inv.dueDate.slice(0, 10)}</Table.Td>
                <Table.Td>
                  <Badge color={inv.status === 'paid' ? 'teal' : 'orange'}>{inv.status}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {inv.status === 'open' && (
                      <Button size="xs" variant="light" onClick={() => handleMarkPaid(inv._id)}>
                        Mark paid
                      </Button>
                    )}
                    <Button size="xs" variant="subtle" onClick={() => openEdit(inv)}>
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(inv)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <InvoiceFormModal
        key={modalKey}
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        invoice={editing}
        prefill={prefill}
      />
    </Container>
  );
}
