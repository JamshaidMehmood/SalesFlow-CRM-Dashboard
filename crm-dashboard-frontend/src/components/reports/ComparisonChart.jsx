import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader } from '../common/Card';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/helpers';

const METRICS = [
  { id: 'dealsClosed', label: 'Deals Closed' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'winRate', label: 'Win Rate' },
];

export default function ComparisonChart({ title, subtitle, data, nameKey = 'name' }) {
  const [metric, setMetric] = useState('revenue');

  if (!data?.length) return null;

  const chartData = data.map((item) => ({
    name: item[nameKey]?.split(' ')[0] || item[nameKey],
    fullName: item[nameKey],
    dealsClosed: item.dealsClosed,
    revenue: item.revenue,
    winRate: item.winRate,
  }));

  const formatValue = (value) => {
    if (metric === 'revenue') return formatCurrency(value);
    if (metric === 'winRate') return `${value}%`;
    return value;
  };

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap gap-1">
            {METRICS.map(({ id, label }) => (
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
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) =>
                metric === 'revenue' ? `$${(v / 1000).toFixed(0)}k` : metric === 'winRate' ? `${v}%` : v
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={false}
              formatter={(value) => [formatValue(value), METRICS.find((m) => m.id === metric)?.label]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
            />
            <Bar dataKey={metric} fill="#0091ae" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
