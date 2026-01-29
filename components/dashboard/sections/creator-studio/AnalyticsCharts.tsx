'use client';

import { Card } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface AnalyticsChartsProps {
  earningsData?: Array<{ month: string; earnings: number }>;
  supporterFlowData?: Array<{ date: string; supporters: number }>;
}

export function AnalyticsCharts({ earningsData = [], supporterFlowData = [] }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20">
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          Monthly Earnings
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={earningsData}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
            <XAxis dataKey="month" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
            <Area type="monotone" dataKey="earnings" stroke="#3B82F6" strokeWidth={2} fill="url(#earningsGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20">
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          Supporter Flow
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={supporterFlowData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
            <XAxis dataKey="date" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
            <Line type="monotone" dataKey="supporters" stroke="#A855F7" strokeWidth={2} dot={{ fill: '#A855F7', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
