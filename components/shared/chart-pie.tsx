'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { useTranslations, useFormatter } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export default function TotalStatusPieChart({
  data,
}: {
  data: { keyType: string; keyFunction: string; Available: number; InUse: number; Lost: number }[];
}) {
  const t = useTranslations('charts');
  const format = useFormatter();

  const chartConfig = {
    Available: {
      label: t('available'),
      color: 'var(--chart-1)',
    },
    InUse: {
      label: t('inUse'),
      color: 'var(--chart-2)',
    },
    Lost: {
      label: t('lost'),
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig;

  // Aggregate totals from all key types
  const totalCounts = data.reduce(
    (acc, item) => ({
      Available: acc.Available + item.Available,
      InUse: acc.InUse + item.InUse,
      Lost: acc.Lost + item.Lost,
    }),
    { Available: 0, InUse: 0, Lost: 0 },
  );

  // Convert to pie chart format
  const pieData = [
    {
      status: 'Available',
      count: totalCounts.Available,
      fill: 'var(--color-Available)',
    },
    {
      status: 'InUse',
      count: totalCounts.InUse,
      fill: 'var(--color-InUse)',
    },
    {
      status: 'Lost',
      count: totalCounts.Lost,
      fill: 'var(--color-Lost)',
    },
  ].filter((item) => item.count > 0); // Only show non-zero values

  const totalKeys = React.useMemo(() => {
    return totalCounts.Available + totalCounts.InUse + totalCounts.Lost;
  }, [totalCounts]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t('pieTitle')}</CardTitle>
        <CardDescription>{t('pieDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={pieData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {format.number(totalKeys)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {t('totalKeys')}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
