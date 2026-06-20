import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { forecastApi } from '../../api';
import { formatCurrency, cn } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  on_track: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  behind: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  no_quota: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_KEYS = {
  on_track: 'dashboard.onTrack',
  behind: 'dashboard.behindQuota',
  no_quota: 'dashboard.noQuotaSetStatus',
};

export default function ForecastWidget({ compact = false }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', period],
    queryFn: () => forecastApi.get({ period }),
  });

  if (isLoading || !data) return null;

  const chartData = data.stageBreakdown?.filter((s) => s.dealCount > 0) || [];

  return (
    <Card className="h-fit">
      <CardHeader
        title={t('dashboard.revenueForecast')}
        subtitle={
          isAdmin
            ? t('dashboard.forecastSubtitleAdmin')
            : t('dashboard.forecastSubtitleRep')
        }
        action={
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('month')}
            >
              {t('dashboard.month')}
            </Button>
            <Button
              size="sm"
              variant={period === 'quarter' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('quarter')}
            >
              {t('dashboard.quarter')}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(data.totalForecast)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t('dashboard.forecastedFrom', { amount: formatCurrency(data.totalRaw) })}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            STATUS_STYLES[data.quotaStatus]
          )}
        >
          {t(STATUS_KEYS[data.quotaStatus])}
          {data.quotaTarget > 0 && ` · ${t('dashboard.ofQuota', { pct: data.quotaProgressPct })}`}
        </span>
      </div>

      {data.quotaTarget > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{t('dashboard.forecastVsQuota')}</span>
            <span>
              {formatCurrency(data.totalForecast)} / {formatCurrency(data.quotaTarget)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                data.quotaStatus === 'on_track' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(100, data.quotaProgressPct)}%` }}
            />
          </div>
        </div>
      )}

      {!compact && chartData.length > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="stageName" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                formatter={(value) => [formatCurrency(value), t('dashboard.forecasted')]}
              />
              <Bar dataKey="forecastedValue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={entry.stageId} fill={['#ff7a59', '#0091ae', '#7c98b6', '#00bda5'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!compact && (
        <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <th className="pb-2 font-medium">{t('common.stage')}</th>
              <th className="pb-2 font-medium">{t('common.deals')}</th>
              <th className="pb-2 font-medium">{t('dashboard.prob')}</th>
              <th className="pb-2 text-right font-medium">{t('dashboard.raw')}</th>
              <th className="pb-2 text-right font-medium">{t('dashboard.forecast')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.stageBreakdown.map((row) => (
              <tr key={row.stageId}>
                <td className="py-2 font-medium text-slate-900 dark:text-white">{row.stageName}</td>
                <td className="py-2 text-slate-600 dark:text-slate-400">{row.dealCount}</td>
                <td className="py-2 text-slate-600 dark:text-slate-400">{row.winProbability}%</td>
                <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                  {formatCurrency(row.rawValue)}
                </td>
                <td className="py-2 text-right font-medium text-brand-500">
                  {formatCurrency(row.forecastedValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Card>
  );
}
