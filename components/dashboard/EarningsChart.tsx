'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface EarningsData {
  summary: {
    totalEarnings: number;
    periodEarnings: number;
    totalSupporters: number;
    activeSupporters: number;
    growthRate: number;
    averageSupport: number;
  };
  earningsBreakdown: { [key: string]: number };
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    message: string;
    created_at: string;
    supporter: {
      id: string;
      display_name: string;
      photo_url?: string;
    };
  }>;
  topSupporters: Array<{
    supporter: {
      id: string;
      display_name: string;
      photo_url?: string;
    };
    totalAmount: number;
    transactionCount: number;
    lastSupport: string;
  }>;
  tierDistribution: { [key: string]: number };
  period: string;
}

interface EarningsChartProps {
  className?: string;
}

const TIER_COLORS = {
  basic: '#3B82F6',
  premium: '#8B5CF6',
  vip: '#F59E0B'
};

export default function EarningsChart({ className }: EarningsChartProps) {
  const { toast } = useToast();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/earnings?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      }
    } catch (error) {
      logger.error('Error fetching earnings data', 'EARNINGS_CHART', { error: error instanceof Error ? error.message : String(error) });
      toast({ title: 'Failed to load earnings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatEarningsChartData = () => {
    if (!earningsData?.earningsBreakdown) return [];
    
    return Object.entries(earningsData.earningsBreakdown)
      .map(([date, amount]) => ({
        date: selectedPeriod === '7d' || selectedPeriod === '30d' 
          ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: amount
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatTierData = () => {
    if (!earningsData?.tierDistribution) return [];
    
    return Object.entries(earningsData.tierDistribution).map(([tier, count]) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      value: count,
      color: TIER_COLORS[tier as keyof typeof TIER_COLORS] || '#6B7280'
    }));
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Failed to load earnings data</p>
        <Button onClick={fetchEarningsData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const chartData = formatEarningsChartData();
  const tierData = formatTierData();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Earnings Analytics</h2>
        <div className="flex space-x-2">
          {[
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: '12 Months', value: '12m' }
          ].map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.summary.totalEarnings)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Period Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.summary.periodEarnings)}
                </p>
                <div className="flex items-center mt-1">
                  {earningsData.summary.growthRate >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    earningsData.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(earningsData.summary.growthRate)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {earningsData.summary.growthRate >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Supporters</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earningsData.summary.activeSupporters}
                </p>
                <p className="text-sm text-gray-500">
                  of {earningsData.summary.totalSupporters} total
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Support</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsData.summary.averageSupport)}
                </p>
                <p className="text-sm text-gray-500">per supporter</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Supporter Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Supporter Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {tierData.map((tier) => (
                <div key={tier.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tier.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {tier.name} ({tier.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="supporters">Top Supporters</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earningsData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {transaction.supporter.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.supporter.display_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.message || 'No message'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supporters">
          <Card>
            <CardHeader>
              <CardTitle>Top Supporters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earningsData.topSupporters.map((supporter, index) => (
                  <div key={supporter.supporter.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {supporter.supporter.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {supporter.supporter.display_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {supporter.transactionCount} transactions
                        </p>
                        <p className="text-xs text-gray-400">
                          Last support: {new Date(supporter.lastSupport).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(supporter.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 