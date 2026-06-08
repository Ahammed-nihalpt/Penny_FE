import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Card,
  Center,
  Grid,
  Group,
  RingProgress,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { AreaChart, BarChart, DonutChart, Sparkline } from '@mantine/charts';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import type { InvoiceSummary } from '@/features/dashboard/types';

const CHART_COLORS = [
  'teal.6',
  'copper.6',
  'cyan.6',
  'grape.6',
  'teal.9',
  'orange.6',
  'blue.5',
  'pink.6',
];

const fmt = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Icon = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
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
const CoinsIcon = () => (
  <Icon>
    <circle cx="9" cy="9" r="6" />
    <path d="M16.5 7.5a6 6 0 1 1-4 10.9" />
  </Icon>
);
const CheckIcon = () => (
  <Icon>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

function StatCard({
  label,
  value,
  tone,
  icon,
  children,
}: {
  label: string;
  value: string;
  tone?: string;
  icon: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.5px' }}>
            {label}
          </Text>
          <Text fw={700} fz="1.7rem" c={tone}>
            {value}
          </Text>
        </Stack>
        <ThemeIcon variant="light" color={tone ?? 'gray'} size={40} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      {children}
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
      <Stack gap="lg">
        <Skeleton h={48} w={280} />
        <Grid>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Skeleton h={170} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Skeleton h={170} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Skeleton h={170} radius="md" />
          </Grid.Col>
        </Grid>
        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Skeleton h={320} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Skeleton h={320} radius="md" />
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }
  if (!summary) {
    return (
      <Alert color="red" title="Couldn’t load the dashboard">
        Something went wrong fetching your totals. Refresh the page to try again.
      </Alert>
    );
  }

  const donutData = summary.byCategory.map((c, i) => ({
    name: c.category,
    value: c.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const categoryTotal = summary.byCategory.reduce((s, c) => s + c.total, 0);
  const trendOpen = summary.overTime.map((o) => o.open);
  const trendPaid = summary.overTime.map((o) => o.paid);

  const hasOverdue = summary.overdue.count > 0;
  const overduePct =
    summary.outstanding > 0 ? Math.round((summary.overdue.total / summary.outstanding) * 100) : 0;
  const standing =
    summary.outstanding > 0
      ? `You have ${fmt(summary.outstanding)} outstanding` +
        (hasOverdue
          ? `, ${fmt(summary.overdue.total)} of it overdue across ${summary.overdue.count} invoice${
              summary.overdue.count === 1 ? '' : 's'
            }.`
          : `, and nothing overdue. Nicely on top of it.`)
      : `You're all paid up. Nothing outstanding right now.`;

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Title order={2}>Here's where your money stands</Title>
        <Text c="dimmed">{standing}</Text>
      </Stack>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <StatCard
            label="Outstanding"
            value={fmt(summary.outstanding)}
            tone="teal"
            icon={<CoinsIcon />}
          >
            <Group gap="xl" mt="md">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Overdue
                </Text>
                <Text size="sm" fw={600} c={hasOverdue ? 'red' : undefined}>
                  {fmt(summary.overdue.total)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  Due this week
                </Text>
                <Text size="sm" fw={600}>
                  {fmt(summary.dueThisWeek)}
                </Text>
              </Stack>
            </Group>
            {trendOpen.length > 1 ? (
              <Sparkline
                h={40}
                mt="md"
                data={trendOpen}
                curveType="monotone"
                color="copper.6"
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            ) : null}
          </StatCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.5px' }}>
              Overdue
            </Text>
            <Center mt="xs">
              <RingProgress
                size={130}
                thickness={12}
                roundCaps
                sections={[{ value: overduePct, color: hasOverdue ? 'red' : 'teal' }]}
                label={
                  <Stack gap={0} align="center">
                    <Text fw={700} fz="lg">
                      {summary.overdue.count}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {overduePct}% of total
                    </Text>
                  </Stack>
                }
              />
            </Center>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Paid this month"
            value={fmt(summary.paidThisMonth)}
            tone="teal"
            icon={<CheckIcon />}
          >
            {trendPaid.length > 1 ? (
              <Sparkline
                h={48}
                mt="md"
                data={trendPaid}
                curveType="monotone"
                color="teal.6"
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            ) : null}
          </StatCard>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Text fw={600} mb="md">
              Cash flow — open vs paid (last 6 months)
            </Text>
            <AreaChart
              h={280}
              data={summary.overTime}
              dataKey="month"
              series={[
                { name: 'open', color: 'copper.6' },
                { name: 'paid', color: 'teal.6' },
              ]}
              curveType="monotone"
              fillOpacity={0.22}
              withDots={false}
              withLegend
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Text fw={600} mb="md">
              Spend by category
            </Text>
            {donutData.length ? (
              <Center>
                <DonutChart
                  data={donutData}
                  withTooltip
                  size={190}
                  thickness={28}
                  chartLabel={fmt(categoryTotal)}
                />
              </Center>
            ) : (
              <Text c="dimmed" size="sm">
                No data yet.
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder padding="lg" radius="md">
        <Text fw={600} mb="md">
          Top vendors
        </Text>
        {summary.topVendors.length ? (
          <BarChart
            h={240}
            data={summary.topVendors}
            dataKey="vendor"
            series={[{ name: 'total', color: 'teal.6' }]}
            withTooltip
          />
        ) : (
          <Text c="dimmed" size="sm">
            No data yet.
          </Text>
        )}
      </Card>
    </Stack>
  );
}
