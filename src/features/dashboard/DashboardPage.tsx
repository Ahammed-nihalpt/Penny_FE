import { useEffect, useState } from 'react';
import { Card, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import type { InvoiceSummary } from '@/features/dashboard/types';

const CHART_COLORS = [
  'teal.6',
  'orange.6',
  'blue.6',
  'grape.6',
  'red.6',
  'yellow.6',
  'cyan.6',
  'pink.6',
];

const fmt = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} fz="1.75rem">
        {value}
      </Text>
      {sub ? (
        <Text size="xs" c="dimmed">
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }
  if (!summary) {
    return <Text c="red">Could not load the dashboard.</Text>;
  }

  const donutData = summary.byCategory.map((c, i) => ({
    name: c.category,
    value: c.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard label="Outstanding" value={fmt(summary.outstanding)} />
        <MetricCard
          label="Overdue"
          value={fmt(summary.overdue.total)}
          sub={`${summary.overdue.count} invoice${summary.overdue.count === 1 ? '' : 's'}`}
        />
        <MetricCard label="Due this week" value={fmt(summary.dueThisWeek)} />
        <MetricCard label="Paid this month" value={fmt(summary.paidThisMonth)} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card withBorder padding="lg" radius="md">
          <Text fw={600} mb="md">
            Spend by category
          </Text>
          {donutData.length ? (
            <Center>
              <DonutChart data={donutData} withTooltip size={200} thickness={32} />
            </Center>
          ) : (
            <Text c="dimmed" size="sm">
              No data yet.
            </Text>
          )}
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text fw={600} mb="md">
            Top vendors
          </Text>
          {summary.topVendors.length ? (
            <BarChart
              h={240}
              data={summary.topVendors}
              dataKey="vendor"
              series={[{ name: 'total', color: 'blue.6' }]}
              withTooltip
            />
          ) : (
            <Text c="dimmed" size="sm">
              No data yet.
            </Text>
          )}
        </Card>
      </SimpleGrid>

      <Card withBorder padding="lg" radius="md">
        <Text fw={600} mb="md">
          Open vs paid (last 6 months)
        </Text>
        <BarChart
          h={280}
          data={summary.overTime}
          dataKey="month"
          series={[
            { name: 'open', color: 'orange.6' },
            { name: 'paid', color: 'teal.6' },
          ]}
          withTooltip
        />
      </Card>
    </Stack>
  );
}
