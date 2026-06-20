import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card, { CardHeader } from '../common/Card';
import ChartLegendToggles from './ChartLegendToggles';
import { CHART_COLORS, formatCurrency } from '../../utils/helpers';

export default function StageDonutChart({ data }) {
  const allItems = useMemo(
    () =>
      (data || [])
        .filter((d) => d.count > 0)
        .map((d, index) => ({
          key: d.stage || d.name,
          label: d.stage || d.name,
          value: d.count,
          revenue: d.value,
          color: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [data]
  );

  const [visibleKeys, setVisibleKeys] = useState(() => new Set(allItems.map((i) => i.key)));

  useEffect(() => {
    setVisibleKeys(new Set(allItems.map((i) => i.key)));
  }, [allItems]);

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
      <CardHeader title="Deal Stage Breakdown" subtitle="Distribution across pipeline stages" />
      {allItems.length === 0 ? (
        <p className="flex h-72 items-center justify-center text-sm text-slate-500">No deals yet</p>
      ) : (
        <>
          <div className="h-56">
            {chartData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                Select at least one stage to view the chart
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(value, name, props) => [
                      `${value} deals (${formatCurrency(props.payload.revenue)})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartLegendToggles items={legendItems} onToggle={toggleItem} />
        </>
      )}
    </Card>
  );
}
