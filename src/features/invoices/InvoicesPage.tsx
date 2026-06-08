import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  FileButton,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import { PennyMark } from '@/components/PennyMark';
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

const Icon = ({ children, size = 16 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
const CheckIcon = () => (
  <Icon>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);
const PencilIcon = () => (
  <Icon>
    <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z" />
    <path d="M14 7l3 3" />
  </Icon>
);
const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Icon>
);
const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
const UploadIcon = () => (
  <Icon>
    <path d="M12 15V3M7 8l5-5 5 5M5 21h14" />
  </Icon>
);
const DownloadIcon = () => (
  <Icon>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </Icon>
);
const SearchIcon = () => (
  <Icon size={15}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icon>
);

const fmtAmount = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

const isOverdue = (inv: Invoice): boolean =>
  inv.status === 'open' && new Date(inv.dueDate) < new Date();

function statusBadge(inv: Invoice): { color: string; label: string } {
  if (inv.status === 'paid') return { color: 'teal', label: 'paid' };
  if (isOverdue(inv)) return { color: 'red', label: 'overdue' };
  return { color: 'copper', label: 'open' };
}

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

  const overdueCount = invoices.filter(isOverdue).length;

  return (
    <Container size="lg" py="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={2}>
            <Title order={2}>Invoices</Title>
            <Group gap="xs">
              <Text c="dimmed" size="sm">
                {invoices.length} invoice{invoices.length === 1 ? '' : 's'}
              </Text>
              {overdueCount > 0 ? (
                <Badge color="red" variant="light" size="sm" radius="sm">
                  {overdueCount} overdue
                </Badge>
              ) : null}
            </Group>
          </Stack>
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<DownloadIcon />}
              onClick={() => void handleExport()}
            >
              Export
            </Button>
            <FileButton
              onChange={handleUpload}
              accept="image/png,image/jpeg,image/webp,application/pdf"
            >
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<UploadIcon />}
                  loading={uploading}
                >
                  Upload
                </Button>
              )}
            </FileButton>
            <Button leftSection={<PlusIcon />} onClick={openAdd}>
              Add invoice
            </Button>
          </Group>
        </Group>

        <Group justify="space-between" wrap="wrap" gap="sm">
          <SegmentedControl
            data={FILTERS}
            value={filter}
            onChange={(v) => setFilter(v as InvoiceFilter)}
          />
          <TextInput
            leftSection={<SearchIcon />}
            placeholder="Search vendor…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            w={{ base: '100%', xs: 240 }}
          />
        </Group>

        {loading && invoices.length === 0 ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h={48} radius="sm" />
            ))}
          </Stack>
        ) : invoices.length === 0 ? (
          <Paper withBorder radius="lg" p="xl">
            <Stack align="center" gap="xs">
              <PennyMark size={44} />
              <Text fz="lg" fw={600}>
                No invoices yet
              </Text>
              <Text c="dimmed" size="sm" ta="center" maw={420}>
                Upload a photo or PDF and Penny will read it for you, or add one by hand.
              </Text>
              <Button mt="sm" leftSection={<PlusIcon />} onClick={openAdd}>
                Add invoice
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={780}>
              <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Vendor</Table.Th>
                    <Table.Th ta="right">Amount</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Due date</Table.Th>
                    <Table.Th>Notes</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {invoices.map((inv) => {
                    const b = statusBadge(inv);
                    const overdue = isOverdue(inv);
                    return (
                      <Table.Tr key={inv._id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {inv.vendor}
                          </Text>
                          {inv.invoiceNumber ? (
                            <Text size="xs" c="dimmed">
                              #{inv.invoiceNumber}
                            </Text>
                          ) : null}
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {fmtAmount(inv.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="gray" radius="sm" size="sm" tt="none">
                            {inv.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={overdue ? 'red' : undefined} fw={overdue ? 600 : 400}>
                            {fmtDate(inv.dueDate)}
                          </Text>
                          {inv.issuedDate ? (
                            <Text size="xs" c="dimmed">
                              Issued {fmtDate(inv.issuedDate)}
                            </Text>
                          ) : null}
                        </Table.Td>
                        <Table.Td>
                          {inv.notes ? (
                            <Tooltip label={inv.notes} multiline maw={280} withArrow>
                              <Text size="sm" c="dimmed" lineClamp={1} maw={180}>
                                {inv.notes}
                              </Text>
                            </Tooltip>
                          ) : (
                            <Text size="sm" c="dimmed">
                              —
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={b.color} variant="light">
                            {b.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            {inv.status === 'open' && (
                              <Tooltip label="Mark paid" withArrow>
                                <ActionIcon
                                  variant="light"
                                  color="teal"
                                  aria-label="Mark paid"
                                  onClick={() => handleMarkPaid(inv._id)}
                                >
                                  <CheckIcon />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            <Tooltip label="Edit" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label="Edit"
                                onClick={() => openEdit(inv)}
                              >
                                <PencilIcon />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete" withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                aria-label="Delete"
                                onClick={() => handleDelete(inv)}
                              >
                                <TrashIcon />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>

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
