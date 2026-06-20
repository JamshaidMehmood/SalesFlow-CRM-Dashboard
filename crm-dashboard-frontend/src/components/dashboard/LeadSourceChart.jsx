import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Card, { CardHeader } from '../common/Card';
import Button from '../common/Button';
import { leadSourcesApi } from '../../api';
import { formatCurrency, CHART_COLORS } from '../../utils/helpers';

export default function LeadSourceChart() {
  const [metric, setMetric] = useState('contactCount');

  const { data = [], isLoading } = useQuery({
    queryKey: ['lead-source-analytics'],
    queryFn: leadSourcesApi.getAnalytics,
  });

  if (isLoading || !data.length) return null;

  const metrics = [
    { id: 'contactCount', label: 'Volume' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'winRate', label: 'Win Rate' },
  ];

  const formatValue = (value) => {
    if (metric === 'revenue') return formatCurrency(value);
    if (metric === 'winRate') return `${value}%`;
    return value;
  };

  return (
    <Card>
      <CardHeader
        title="Lead Source Performance"
        subtitle="Volume, revenue, and win rate by channel"
        action={
          <div className="flex gap-1">
            {metrics.map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                variant={metric === id ? 'primary' : 'secondary'}
                onClick={() => setMetric(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        }
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="sourceName" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                metric === 'revenue' ? `$${(v / 1000).toFixed(0)}k` : metric === 'winRate' ? `${v}%` : v
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={false} formatter={(value) => [formatValue(value), metrics.find((m) => m.id === metric)?.label]} />
            <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
