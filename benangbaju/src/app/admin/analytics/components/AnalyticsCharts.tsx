'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { formatIDR } from '@/lib/utils/format'

interface AnalyticsChartsProps {
  revenueTrends: Array<{ date: string; revenue: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

export function RevenueTrendChart({ revenueTrends }: { revenueTrends: AnalyticsChartsProps['revenueTrends'] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={revenueTrends}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#737373' }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#737373' }}
          tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [formatIDR(Number(value) || 0), 'Pendapatan']}
          contentStyle={{
            fontSize: '12px',
            border: '1px solid #e5e5e5',
            borderRadius: '0',
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#171717"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TopProductsChart({ topProducts }: { topProducts: AnalyticsChartsProps['topProducts'] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#737373' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#171717' }}
          width={100}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f5' }}
          contentStyle={{
            fontSize: '12px',
            border: '1px solid #e5e5e5',
            borderRadius: '0',
          }}
        />
        <Bar dataKey="quantity" fill="#171717" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
