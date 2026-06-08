import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useChatStore } from '@/features/chat/chatStore';
import { useInvoicesStore } from '@/features/invoices/invoicesStore';
import { ModelPicker } from '@/features/models/ModelPicker';
import { PennyMark } from '@/components/PennyMark';
import { Markdown } from '@/components/Markdown';
import type { AgentAction } from '@/features/chat/types';
import type { Invoice } from '@/features/invoices/types';

const SUGGESTIONS = [
  'What do I owe?',
  'Show my overdue invoices',
  'What did I pay this month?',
  'Email me my summary',
];

const fmtMoney = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
const invStatus = (inv: Invoice): { color: string; label: string } => {
  if (inv.status === 'paid') return { color: 'teal', label: 'paid' };
  if (new Date(inv.dueDate) < new Date()) return { color: 'red', label: 'overdue' };
  return { color: 'copper', label: 'open' };
};

// Turns a recorded tool call into a human, grounded one-liner. "read" tools
// (lookups) are copper; "write" tools (changes Penny made) are teal.
function describeAction(
  a: AgentAction,
  byId: Map<string, Invoice>,
): { label: string; write: boolean } {
  const names = a.invoiceIds.map((id) => byId.get(id)?.vendor).filter(Boolean) as string[];
  const list =
    names.slice(0, 3).join(', ') + (names.length > 3 ? `, +${names.length - 3} more` : '');
  const count = a.invoiceIds.length;
  switch (a.tool) {
    case 'query_invoices':
      return {
        write: false,
        label: count ? `Looked up ${count} invoice${count === 1 ? '' : 's'}` : 'Looked up invoices',
      };
    case 'get_summary':
      return { write: false, label: 'Checked your totals' };
    case 'mark_paid':
      return { write: true, label: list ? `Marked paid: ${list}` : 'Marked an invoice paid' };
    case 'create_invoice':
      return { write: true, label: list ? `Created invoice: ${list}` : 'Created an invoice' };
    case 'update_invoice':
      return { write: true, label: list ? `Updated invoice: ${list}` : 'Updated an invoice' };
    case 'delete_invoice':
      return { write: true, label: 'Deleted an invoice' };
    case 'email_summary':
      return { write: true, label: 'Emailed your summary' };
    case 'set_preferred_name':
      return { write: true, label: 'Updated what to call you' };
    default:
      return { write: false, label: a.tool };
  }
}

const fmtTime = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const fmtRelative = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const SendIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const StopIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
  </svg>
);

const AlertIcon = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" role="img" aria-label="Error">
    <circle cx="12" cy="12" r="11" fill="var(--mantine-color-red-6)" />
    <rect x="11" y="6" width="2" height="7" rx="1" fill="#fff" />
    <circle cx="12" cy="16.5" r="1.2" fill="#fff" />
  </svg>
);

export function CopilotPage() {
  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeId);
  const messages = useChatStore((s) => s.messages);
  const sendingSessionId = useChatStore((s) => s.sendingSessionId);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const newChat = useChatStore((s) => s.newChat);
  const select = useChatStore((s) => s.select);
  const send = useChatStore((s) => s.send);
  const retryLast = useChatStore((s) => s.retryLast);
  const stop = useChatStore((s) => s.stop);
  const remove = useChatStore((s) => s.remove);
  const lastChangedIds = useChatStore((s) => s.lastChangedIds);

  const invoices = useInvoicesStore((s) => s.invoices);
  const loadInvoices = useInvoicesStore((s) => s.load);

  const [input, setInput] = useState('');
  const viewport = useRef<HTMLDivElement>(null);
  const invoiceById = useMemo(() => new Map(invoices.map((i) => [i._id, i])), [invoices]);
  // Show the typing/Stop state only for the chat you're actually looking at.
  const sending = sendingSessionId === activeId;

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  // Live panel: (re)load invoices on mount and whenever a chat turn finishes,
  // so actions the agent took (mark paid / create) appear immediately.
  useEffect(() => {
    if (!sending) void loadInvoices();
  }, [sending, loadInvoices]);

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    void send(text);
  };

  const handleSuggestion = (text: string) => {
    if (sending) return;
    void send(text);
  };

  return (
    <Group align="stretch" gap="md" h="calc(100vh - 2rem)" wrap="nowrap">
      {/* Sessions */}
      <Paper
        withBorder
        radius="lg"
        p="sm"
        w={240}
        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Button onClick={() => void newChat()} variant="light" radius="md" mb="xs">
          + New chat
        </Button>
        {sessions.length > 0 ? (
          <Text
            size="xs"
            tt="uppercase"
            fw={600}
            c="dimmed"
            px={6}
            mb={4}
            style={{ letterSpacing: '0.5px' }}
          >
            Recent
          </Text>
        ) : null}
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={2}>
            {sessions.length === 0 ? (
              <Text c="dimmed" size="xs" ta="center" py="sm">
                No chats yet.
              </Text>
            ) : (
              sessions.map((s) => {
                const active = s._id === activeId;
                return (
                  <Group key={s._id} className="penny-session" gap={2} wrap="nowrap" align="center">
                    <Button
                      variant={active ? 'light' : 'subtle'}
                      color={active ? 'teal' : 'gray'}
                      justify="flex-start"
                      size="sm"
                      radius="md"
                      h="auto"
                      py={6}
                      style={{ flex: 1, minWidth: 0 }}
                      onClick={() => void select(s._id)}
                    >
                      <Stack gap={0} align="flex-start" style={{ minWidth: 0, width: '100%' }}>
                        <Text
                          truncate
                          size="sm"
                          fw={active ? 600 : 500}
                          style={{ maxWidth: '100%' }}
                        >
                          {s.title}
                        </Text>
                        {fmtRelative(s.updatedAt) ? (
                          <Text size="xs" c="dimmed" fw={400}>
                            {fmtRelative(s.updatedAt)}
                          </Text>
                        ) : null}
                      </Stack>
                    </Button>
                    <ActionIcon
                      className="penny-session__del"
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Delete chat"
                      onClick={() => void remove(s._id)}
                    >
                      ×
                    </ActionIcon>
                  </Group>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </Paper>

      {/* Conversation */}
      <Paper
        withBorder
        radius="lg"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" px="md" py="sm" bg="copper.0">
          <Group gap={10} wrap="nowrap">
            <Box style={{ position: 'relative', lineHeight: 0 }}>
              <PennyMark size={30} />
              <Box
                style={{
                  position: 'absolute',
                  right: -1,
                  bottom: -1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-teal-6)',
                  border: '2px solid var(--mantine-color-copper-0)',
                }}
              />
            </Box>
            <div>
              <Text fw={700} size="sm" lh={1.15}>
                Penny
              </Text>
              <Text size="xs" c="dimmed">
                Invoice copilot · ready
              </Text>
            </div>
          </Group>
          <ModelPicker />
        </Group>
        <Divider />

        <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
          <Stack gap="md" p="md">
            {messages.length === 0 && !sending ? (
              <Stack align="center" gap="md" py={48}>
                <PennyMark size={52} />
                <Stack gap={4} align="center">
                  <Text fw={600} fz="lg">
                    Ask Penny anything about your invoices
                  </Text>
                  <Text c="dimmed" size="sm" ta="center" maw={380}>
                    She can total what you owe, find overdue bills, or mark one paid.
                  </Text>
                </Stack>
                <Group justify="center" gap="xs">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      size="xs"
                      variant="default"
                      radius="xl"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </Group>
              </Stack>
            ) : null}

            {messages.map((m) =>
              m.error ? (
                <Group key={m._id} align="flex-start" gap={8} wrap="nowrap">
                  <Box mt={2}>
                    <AlertIcon />
                  </Box>
                  <Paper
                    py={8}
                    px="md"
                    bg="red.0"
                    maw="78%"
                    withBorder
                    style={{
                      borderColor: 'var(--mantine-color-red-2)',
                      borderRadius: '16px 16px 16px 4px',
                    }}
                  >
                    <Text size="sm" c="red.9">
                      {m.content}
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      mt={8}
                      onClick={() => retryLast()}
                    >
                      Try again
                    </Button>
                  </Paper>
                </Group>
              ) : m.role === 'user' ? (
                <Group key={m._id} justify="flex-end" gap={0}>
                  <Stack gap={2} align="flex-end" maw="78%">
                    <Paper
                      py={8}
                      px="md"
                      bg="teal.6"
                      style={{
                        borderRadius: '16px 16px 4px 16px',
                        boxShadow: 'var(--mantine-shadow-xs)',
                      }}
                    >
                      <Text size="sm" c="white" style={{ whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </Text>
                    </Paper>
                    {fmtTime(m.createdAt) ? (
                      <Text size="xs" c="dimmed" pr={4}>
                        {fmtTime(m.createdAt)}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
              ) : (
                <Group key={m._id} align="flex-start" gap={8} wrap="nowrap">
                  <Box mt={2}>
                    <PennyMark size={26} />
                  </Box>
                  <Stack gap={6} maw="78%" style={{ minWidth: 0 }}>
                    {m.actions && m.actions.length > 0 ? (
                      <Stack gap={3} pl={2}>
                        {m.actions.map((a, i) => {
                          const d = describeAction(a, invoiceById);
                          return (
                            <Group key={i} gap={6} wrap="nowrap">
                              <Box
                                w={6}
                                h={6}
                                style={{
                                  flexShrink: 0,
                                  borderRadius: '50%',
                                  background: `var(--mantine-color-${d.write ? 'teal' : 'copper'}-5)`,
                                }}
                              />
                              <Text size="xs" c="dimmed">
                                {d.label}
                              </Text>
                            </Group>
                          );
                        })}
                      </Stack>
                    ) : null}
                    <Paper
                      py={8}
                      px="md"
                      bg="copper.0"
                      withBorder
                      style={{
                        borderColor: 'var(--mantine-color-copper-1)',
                        borderRadius: '16px 16px 16px 4px',
                        width: 'fit-content',
                        maxWidth: '100%',
                        boxShadow: 'var(--mantine-shadow-xs)',
                      }}
                    >
                      {m.content ? (
                        <Markdown>{m.content}</Markdown>
                      ) : (
                        <Loader size="sm" type="dots" color="copper" />
                      )}
                    </Paper>
                    {fmtTime(m.createdAt) ? (
                      <Text size="xs" c="dimmed" pl={4}>
                        {fmtTime(m.createdAt)}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
              ),
            )}
          </Stack>
        </ScrollArea>

        <Divider />
        <Box p="sm">
          <Paper
            withBorder
            radius="xl"
            px="xs"
            py={4}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
              boxShadow: 'var(--mantine-shadow-sm)',
            }}
          >
            <Textarea
              variant="unstyled"
              style={{ flex: 1 }}
              styles={{ input: { paddingLeft: 8, paddingRight: 4 } }}
              placeholder="Message Penny…"
              autosize
              minRows={1}
              maxRows={5}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {sending ? (
              <ActionIcon
                color="red"
                variant="filled"
                radius="xl"
                size="lg"
                onClick={stop}
                aria-label="Stop"
              >
                <StopIcon />
              </ActionIcon>
            ) : (
              <ActionIcon
                color="teal"
                variant="filled"
                radius="xl"
                size="lg"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send"
              >
                <SendIcon />
              </ActionIcon>
            )}
          </Paper>
          <Text size="xs" c="dimmed" ta="center" mt={6}>
            Enter to send · Shift+Enter for a new line
          </Text>
        </Box>
      </Paper>

      {/* Live invoices */}
      <Paper
        withBorder
        radius="lg"
        p="sm"
        w={300}
        visibleFrom="md"
        style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Group justify="space-between" align="center" px="xs" mb="xs">
          <Text fw={600} size="sm">
            Your invoices
          </Text>
          {invoices.length > 0 ? (
            <Badge size="sm" variant="light" color="gray" radius="sm">
              {invoices.length}
            </Badge>
          ) : null}
        </Group>
        <Divider mb="xs" />
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={6} px={2}>
            {invoices.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="sm">
                No invoices yet.
              </Text>
            ) : (
              invoices.map((inv) => {
                const changed = lastChangedIds.includes(inv._id);
                const st = invStatus(inv);
                return (
                  <Paper
                    key={inv._id}
                    withBorder
                    p="xs"
                    radius="md"
                    bg={changed ? 'copper.1' : undefined}
                    style={changed ? { borderColor: 'var(--mantine-color-copper-3)' } : undefined}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Text size="sm" fw={500} truncate>
                        {inv.vendor}
                      </Text>
                      <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtMoney(inv.amount)}
                      </Text>
                    </Group>
                    {inv.invoiceNumber ? (
                      <Text size="xs" c="dimmed">
                        #{inv.invoiceNumber}
                      </Text>
                    ) : null}
                    {inv.notes ? (
                      <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                        {inv.notes}
                      </Text>
                    ) : null}
                    <Group justify="space-between" align="center" wrap="nowrap" gap="xs" mt={6}>
                      <Badge size="xs" variant="light" color={st.color}>
                        {st.label}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        Due {fmtShortDate(inv.dueDate)}
                      </Text>
                    </Group>
                  </Paper>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </Paper>
    </Group>
  );
}
