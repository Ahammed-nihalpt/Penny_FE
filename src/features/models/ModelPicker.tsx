import { useCallback, useEffect, useState } from 'react';
import { Badge, Group, Select, Text, Tooltip } from '@mantine/core';
import { modelsApi } from '@/features/models/modelsApi';
import type { ModelsResponse } from '@/features/models/types';
import { useChatStore } from '@/features/chat/chatStore';

export function ModelPicker() {
  const sending = useChatStore((s) => s.sendingSessionId !== null);
  const [data, setData] = useState<ModelsResponse | null>(null);

  const load = useCallback(() => {
    void modelsApi.list().then(setData);
  }, []);

  // Load on mount, and refresh usage after each chat turn finishes.
  useEffect(() => {
    if (!sending) load();
  }, [sending, load]);

  if (!data) return null;
  const current = data.models.find((m) => m.id === data.current);

  const onChange = (id: string | null) => {
    if (!id) return;
    void modelsApi.select(id).then(() => load());
  };

  return (
    <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
      <Text size="xs" c="dimmed" visibleFrom="sm">
        Model
      </Text>
      <Select
        size="xs"
        w={{ base: 150, sm: 210 }}
        value={data.current}
        onChange={onChange}
        allowDeselect={false}
        data={data.models.map((m) => ({
          value: m.id,
          label: `${m.label}${m.rateLimited ? ' ⚠' : ''}`,
        }))}
      />
      {/* Status + usage are detail; hide on phones to keep the header tidy. */}
      {current ? (
        <Group gap="xs" wrap="nowrap" visibleFrom="md">
          <Badge variant="light" color={current.rateLimited ? 'red' : 'teal'}>
            {current.rateLimited ? 'Rate-limited today' : 'Available'}
          </Badge>
          <Tooltip
            label="Approximate — counts only requests sent through Penny this session/day, not Google's real quota (which isn't exposed via API)."
            multiline
            w={260}
          >
            <Text size="xs" c="dimmed">
              ~{current.usedToday} sent today
            </Text>
          </Tooltip>
        </Group>
      ) : null}
    </Group>
  );
}
