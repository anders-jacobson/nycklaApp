'use client';
import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart';

const chartConfig = {
  Available: {
    label: 'Available',
    color: 'var(--chart-1)',
  },
  InUse: {
    label: 'In Use',
    color: 'var(--chart-2)',
  },
  Lost: {
    label: 'Lost',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export default function KeyChart({
  data,
}: {
  data: { keyType: string; keyFunction: string; Available: number; InUse: number; Lost: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status per key type</CardTitle>
        <CardDescription>Breakdown of key status by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="keyType"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length && label) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="grid gap-2">
                        <div className="text-sm text-muted-foreground">{data.keyFunction}</div>
                        <div className="grid gap-1">
                          {payload.map((entry, index) => (
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
              dataKey="Available"
              stackId="a"
              fill="var(--color-Available)"
              radius={[0, 0, 4, 4]}
              maxBarSize={60}
            />
            <Bar
              dataKey="InUse"
              stackId="a"
              fill="var(--color-InUse)"
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="Lost"
              stackId="a"
              fill="var(--color-Lost)"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
