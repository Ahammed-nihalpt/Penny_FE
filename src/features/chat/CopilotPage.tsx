import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
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

export function CopilotPage() {
  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeId);
  const messages = useChatStore((s) => s.messages);
  const sending = useChatStore((s) => s.sending);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const newChat = useChatStore((s) => s.newChat);
  const select = useChatStore((s) => s.select);
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);
  const remove = useChatStore((s) => s.remove);
  const lastChangedIds = useChatStore((s) => s.lastChangedIds);

  const invoices = useInvoicesStore((s) => s.invoices);
  const loadInvoices = useInvoicesStore((s) => s.load);

  const [input, setInput] = useState('');
  const viewport = useRef<HTMLDivElement>(null);

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

  return (
    <Group align="stretch" gap="md" h="calc(100vh - 92px)" wrap="nowrap">
      <Stack w={240} gap="xs" style={{ flexShrink: 0 }}>
        <Button onClick={() => void newChat()} variant="light">
          + New chat
        </Button>
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={4}>
            {sessions.map((s) => (
              <Group key={s._id} gap={4} wrap="nowrap">
                <Button
                  variant={s._id === activeId ? 'light' : 'subtle'}
                  justify="flex-start"
                  size="sm"
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={() => void select(s._id)}
                >
                  <Text truncate size="sm">
                    {s.title}
                  </Text>
                </Button>
                <ActionIcon variant="subtle" color="red" onClick={() => void remove(s._id)}>
                  ×
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>

      <Stack style={{ flex: 1, minWidth: 0 }} gap="sm">
        <ModelPicker />
        <ScrollArea style={{ flex: 1 }} viewportRef={viewport}>
          <Stack gap="sm" p="sm">
            {messages.length === 0 && !sending ? (
              <Text c="dimmed" ta="center" py="xl">
                Start chatting with Penny.
              </Text>
            ) : null}
            {messages.map((m) => (
              <Group key={m._id} justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                <Paper p="sm" radius="md" bg={m.role === 'user' ? 'teal.1' : 'gray.1'} maw="75%">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </Text>
                </Paper>
              </Group>
            ))}
            {sending ? (
              <Group>
                <Loader size="sm" />
              </Group>
            ) : null}
          </Stack>
        </ScrollArea>

        <Group gap="xs" wrap="nowrap">
          <Textarea
            style={{ flex: 1 }}
            placeholder="Message Penny…"
            autosize
            minRows={1}
            maxRows={4}
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
            <Button color="red" variant="light" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button onClick={handleSend}>Send</Button>
          )}
        </Group>
      </Stack>

      <Stack w={300} gap="xs" style={{ flexShrink: 0 }}>
        <Text fw={600} size="sm">
          Your invoices
        </Text>
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={6}>
            {invoices.length === 0 ? (
              <Text c="dimmed" size="sm">
                No invoices yet.
              </Text>
            ) : (
              invoices.map((inv) => (
                <Card
                  key={inv._id}
                  withBorder
                  padding="xs"
                  radius="md"
                  bg={lastChangedIds.includes(inv._id) ? 'yellow.2' : undefined}
                >
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm" truncate>
                      {inv.vendor}
                    </Text>
                    <Text size="sm" fw={600}>
                      {inv.amount.toFixed(2)}
                    </Text>
                  </Group>
                  <Badge size="xs" color={inv.status === 'paid' ? 'teal' : 'orange'} mt={4}>
                    {inv.status}
                  </Badge>
                </Card>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Group>
  );
}
