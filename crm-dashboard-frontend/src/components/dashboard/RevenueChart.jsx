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
import { formatCurrency } from '../../utils/helpers';

export default function RevenueChart({ data }) {
  return (
    <Card>
      <CardHeader title="Monthly Revenue" subtitle="Won deals over the last 6 months" />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              className="text-slate-500"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              className="text-slate-500"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={false}
              formatter={(value) => [formatCurrency(value), 'Revenue']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="revenue" fill="#ff7a59" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
