import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card, { CardHeader } from '../common/Card';
import ChartLegendToggles from './ChartLegendToggles';
import { LOST_REASON_LABELS, CHART_COLORS } from '../../utils/helpers';

export default function LostReasonChart({ data = [] }) {
  const allItems = useMemo(
    () =>
      data.map((d, index) => ({
        key: d.reason,
        label: LOST_REASON_LABELS[d.reason] || d.reason,
        value: d.count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [data]
  );

  const [visibleKeys, setVisibleKeys] = useState(() => new Set(allItems.map((i) => i.key)));

  useEffect(() => {
    setVisibleKeys(new Set(allItems.map((i) => i.key)));
  }, [allItems]);

  if (!allItems.length) return null;

  const chartData = allItems.filter((item) => visibleKeys.has(item.key));

  const toggleItem = (key) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const legendItems = allItems.map((item) => ({
    key: item.key,
    label: item.label,
    color: item.color,
    checked: visibleKeys.has(item.key),
  }));

  return (
    <Card>
      <CardHeader title="Lost Deal Reasons" subtitle="Why deals didn't close" />
      <div className="h-52">
        {chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            Select at least one reason to view the chart
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip cursor={false} formatter={(value) => [`${value} deals`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <ChartLegendToggles items={legendItems} onToggle={toggleItem} />
    </Card>
  );
}
