import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Percent, DollarSign, Clock } from 'lucide-react';
import { reportsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import KpiCard from '../../components/dashboard/KpiCard';
import Card from '../../components/common/Card';
import RepComparisonChart from '../../components/reports/RepComparisonChart';
import ComparisonChart from '../../components/reports/ComparisonChart';
import ForecastWidget from '../../components/dashboard/ForecastWidget';
import LeadSourceChart from '../../components/dashboard/LeadSourceChart';
import { Select } from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { BarChart3 } from 'lucide-react';

const PRESET_KEYS = [
  { value: 'this_month', labelKey: 'reports.thisMonth' },
  { value: 'last_month', labelKey: 'reports.lastMonth' },
  { value: 'this_quarter', labelKey: 'reports.thisQuarter' },
  { value: 'custom', labelKey: 'reports.customRange' },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [preset, setPreset] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queryParams =
    preset === 'custom' && customFrom && customTo
      ? { preset: 'custom', from: customFrom, to: customTo }
      : { preset: preset === 'custom' ? 'this_month' : preset };

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', queryParams],
    queryFn: () => reportsApi.get(queryParams),
    enabled: preset !== 'custom' || !!(customFrom && customTo),
  });

  if (isLoading) return <PageLoader />;
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {t('reports.loadError')}
      </div>
    );
  }

  const { metrics, repComparison, teamComparison, territoryComparison, hasData } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h1>
          <p className="mt-1 text-slate-500">
            {isAdmin ? t('reports.subtitleAdmin') : t('reports.subtitleRep')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            label={t('reports.dateRange')}
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="sm:w-44"
          >
            {PRESET_KEYS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(p.labelKey)}
              </option>
            ))}
          </Select>
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </>
          )}
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title={t('reports.noDataTitle')}
          description={t('reports.noDataDesc')}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              title={t('reports.winRate')}
              value={`${metrics.winRate.value}%`}
              icon={Percent}
              trend={metrics.winRate.trend}
              trendLabel={t('reports.vsPreviousPeriod')}
            />
            <KpiCard
              title={t('reports.avgDealSize')}
              value={formatCurrency(metrics.avgDealSize.value)}
              icon={DollarSign}
              trend={metrics.avgDealSize.trend}
              trendLabel={t('reports.vsPreviousPeriod')}
            />
            <KpiCard
              title={t('reports.salesCycleLength')}
              value={`${metrics.salesCycleLength.value} ${t('reports.days')}`}
              icon={Clock}
              trend={metrics.salesCycleLength.trend}
              trendLabel={t('reports.vsPreviousPeriod')}
            />
          </div>

          <RepComparisonChart data={repComparison} isAdmin={isAdmin} />

          {isAdmin && teamComparison?.length > 0 && (
            <ComparisonChart
              title={t('reports.teamPerformance')}
              subtitle={t('reports.teamPerformanceSubtitle')}
              data={teamComparison}
            />
          )}

          {isAdmin && territoryComparison?.length > 0 && (
            <ComparisonChart
              title={t('reports.territoryPerformance')}
              subtitle={t('reports.territoryPerformanceSubtitle')}
              data={territoryComparison}
            />
          )}

          {isAdmin && (teamComparison?.length > 0 || territoryComparison?.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {teamComparison?.length > 0 && (
                <Card padding={false}>
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{t('reports.teamBreakdown')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
                          <th className="px-4 py-2">{t('common.team')}</th>
                          <th className="px-4 py-2">{t('common.deals')}</th>
                          <th className="px-4 py-2">{t('common.revenue')}</th>
                          <th className="px-4 py-2">{t('reports.winRate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {teamComparison.map((row) => (
                          <tr key={row.teamId}>
                            <td className="px-4 py-2 font-medium">{row.name}</td>
                            <td className="px-4 py-2">{row.dealsClosed}</td>
                            <td className="px-4 py-2">{formatCurrency(row.revenue)}</td>
                            <td className="px-4 py-2">{row.winRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
              {territoryComparison?.length > 0 && (
                <Card padding={false}>
                  <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{t('reports.territoryBreakdown')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
                          <th className="px-4 py-2">{t('contacts.territory')}</th>
                          <th className="px-4 py-2">{t('common.deals')}</th>
                          <th className="px-4 py-2">{t('common.revenue')}</th>
                          <th className="px-4 py-2">{t('reports.winRate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {territoryComparison.map((row) => (
                          <tr key={row.territoryId}>
                            <td className="px-4 py-2 font-medium">{row.name}</td>
                            <td className="px-4 py-2">{row.dealsClosed}</td>
                            <td className="px-4 py-2">{formatCurrency(row.revenue)}</td>
                            <td className="px-4 py-2">{row.winRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          <LeadSourceChart />
        </>
      )}

      <ForecastWidget />
    </div>
  );
}
