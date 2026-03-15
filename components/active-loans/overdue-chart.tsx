'use client';
import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart';

export default function OverdueChart({
  data,
}: {
  data: {
    category: string;
    Critical: number;
    Urgent: number;
    DueSoon: number;
    ThisWeek: number;
    Later: number;
    total: number;
  };
}) {
  const t = useTranslations('activeLoans');

  const chartConfig = {
    Critical: {
      label: t('critical'),
      color: 'var(--chart-1)',
    },
    Urgent: {
      label: t('urgent'),
      color: 'var(--chart-2)',
    },
    DueSoon: {
      label: t('dueSoon'),
      color: 'var(--chart-3)',
    },
    ThisWeek: {
      label: t('thisWeek'),
      color: 'var(--chart-4)',
    },
    Later: {
      label: t('later'),
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig;

  // Don't show chart if there are no active loans
  if (data.total === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('overdueTitle')}</CardTitle>
        <CardDescription>{t('overdueDescription', { total: data.total })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <BarChart
            accessibilityLayer
            data={[data]}
            layout="vertical"
            margin={{ left: 0, right: 12, top: 12, bottom: 12 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="category" type="category" hide />
            <XAxis type="number" hide />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          {payload
                            .filter((entry) => typeof entry.value === 'number' && entry.value > 0)
                            .map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">{entry.name}:</span>
                                <span className="font-medium">{entry.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="Critical"
              stackId="a"
              fill="var(--color-Critical)"
              radius={[4, 0, 0, 4]}
              maxBarSize={60}
            />
            <Bar
              dataKey="Urgent"
              stackId="a"
              fill="var(--color-Urgent)"
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="DueSoon"
              stackId="a"
              fill="var(--color-DueSoon)"
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="ThisWeek"
              stackId="a"
              fill="var(--color-ThisWeek)"
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="Later"
              stackId="a"
              fill="var(--color-Later)"
              radius={[0, 4, 4, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
