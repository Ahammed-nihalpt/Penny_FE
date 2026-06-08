import { useState } from 'react';
import { Button, Modal, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { INVOICE_CATEGORIES } from '@/features/invoices/types';
import type { CreateInvoiceInput, Invoice, InvoiceCategory } from '@/features/invoices/types';
import { useInvoicesStore } from '@/features/invoices/invoicesStore';

interface Props {
  opened: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  prefill?: Partial<CreateInvoiceInput> | null;
}

export function InvoiceFormModal({ opened, onClose, invoice, prefill }: Props) {
  const create = useInvoicesStore((s) => s.create);
  const update = useInvoicesStore((s) => s.update);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(invoice);

  // The page passes a changing `key`, so this component remounts per invoice/draft
  // and these initial values reflect the row being edited, a vision-extracted draft,
  // or a blank add form.
  const source = invoice ?? prefill ?? null;
  const initialDue = invoice ? invoice.dueDate.slice(0, 10) : (prefill?.dueDate ?? '');
  const initialIssued = invoice
    ? (invoice.issuedDate?.slice(0, 10) ?? '')
    : (prefill?.issuedDate ?? '');
  const form = useForm({
    initialValues: {
      vendor: source?.vendor ?? '',
      invoiceNumber: source?.invoiceNumber ?? '',
      amount: source?.amount ?? 0,
      category: source?.category ?? 'Other',
      dueDate: initialDue,
      issuedDate: initialIssued,
      email: source?.email ?? '',
      notes: source?.notes ?? '',
    },
    validate: {
      vendor: (v) => (v.trim() ? null : 'Required'),
      amount: (v: number) => (v > 0 ? null : 'Must be greater than 0'),
      dueDate: (v) => (v ? null : 'Required'),
    },
  });

  const submit = form.onSubmit(async (values) => {
    setBusy(true);
    const payload = {
      vendor: values.vendor,
      invoiceNumber: values.invoiceNumber || undefined,
      amount: Number(values.amount),
      category: values.category as InvoiceCategory,
      dueDate: new Date(values.dueDate).toISOString(),
      issuedDate: values.issuedDate ? new Date(values.issuedDate).toISOString() : undefined,
      email: values.email || undefined,
      notes: values.notes || undefined,
    };
    try {
      if (invoice) {
        await update(invoice._id, payload);
        notifications.show({ color: 'teal', message: 'Invoice updated' });
      } else {
        await create(payload);
        notifications.show({ color: 'teal', message: 'Invoice added' });
      }
      onClose();
    } catch {
      notifications.show({ color: 'red', message: 'Could not save invoice' });
    } finally {
      setBusy(false);
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit invoice' : 'Add invoice'}
      centered
    >
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="Vendor" {...form.getInputProps('vendor')} />
          <TextInput
            label="Invoice number (optional)"
            placeholder="e.g. INV-2025-0412"
            {...form.getInputProps('invoiceNumber')}
          />
          <NumberInput label="Amount" min={0} decimalScale={2} {...form.getInputProps('amount')} />
          <Select
            label="Category"
            data={[...INVOICE_CATEGORIES]}
            allowDeselect={false}
            {...form.getInputProps('category')}
          />
          <TextInput
            label="Issued date (optional)"
            type="date"
            {...form.getInputProps('issuedDate')}
          />
          <TextInput label="Due date" type="date" {...form.getInputProps('dueDate')} />
          <TextInput label="Vendor email (optional)" {...form.getInputProps('email')} />
          <Textarea
            label="Notes (optional)"
            placeholder="What was this invoice for?"
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps('notes')}
          />
          <Button type="submit" loading={busy}>
            {isEdit ? 'Save changes' : 'Add invoice'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
