import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, Target, Briefcase, Phone, Mail, Calendar, StickyNote } from 'lucide-react';
import { dashboardApi } from '../../api';
import KpiCard from '../../components/dashboard/KpiCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import StageDonutChart from '../../components/dashboard/StageDonutChart';
import TasksWidget from '../../components/dashboard/TasksWidget';
import QuotaProgressWidget from '../../components/dashboard/QuotaProgressWidget';
import ForecastWidget from '../../components/dashboard/ForecastWidget';
import LostReasonChart from '../../components/dashboard/LostReasonChart';
import LeadSourceChart from '../../components/dashboard/LeadSourceChart';
import OnboardingChecklist from '../../components/onboarding/OnboardingChecklist';
import Card, { CardHeader } from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime, contactName } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

const ACTIVITY_PAGE_SIZE_DEFAULT = 5;

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(ACTIVITY_PAGE_SIZE_DEFAULT);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const recentActivities = data?.recentActivities;

  useEffect(() => {
    setActivityPage(1);
  }, [activityPageSize]);

  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return (recentActivities || []).slice(start, start + activityPageSize);
  }, [recentActivities, activityPage, activityPageSize]);

  const showActivityPagination = (recentActivities?.length || 0) > activityPageSize;

  if (isLoading) return <PageLoader />;
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {t('dashboard.loadError')}
      </div>
    );
  }

  const { kpis, monthlyRevenue, stageBreakdown, tasks, lostReasonBreakdown } = data;

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="mt-1 text-slate-500">
          {isAdmin ? t('dashboard.subtitleAdmin') : t('dashboard.subtitleRep')}
        </p>
      </div>

      <OnboardingChecklist />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={t('dashboard.totalLeads')}
          value={kpis.totalLeads}
          icon={Users}
          trend={12}
          trendLabel={t('common.vsLastMonth')}
        />
        <KpiCard
          title={t('dashboard.totalRevenue')}
          value={formatCurrency(kpis.totalRevenue)}
          icon={DollarSign}
          trend={8}
          trendLabel={t('common.vsLastMonth')}
        />
        <KpiCard
          title={t('dashboard.conversionRate')}
          value={`${kpis.conversionRate}%`}
          icon={Target}
          trend={kpis.conversionRate > 20 ? 5 : -3}
          trendLabel={t('common.vsLastMonth')}
        />
        <KpiCard
          title={t('dashboard.openDeals')}
          value={kpis.openDeals}
          icon={Briefcase}
          trend={-2}
          trendLabel={t('common.vsLastMonth')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <TasksWidget tasks={tasks} />
        <QuotaProgressWidget />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyRevenue} />
        <StageDonutChart data={stageBreakdown} />
      </div>

      {lostReasonBreakdown?.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <LostReasonChart data={lostReasonBreakdown} />
          <LeadSourceChart />
        </div>
      )}

      {!lostReasonBreakdown?.length && <LeadSourceChart />}

      <Card padding={false}>
        <div className="p-4 pb-0">
          <CardHeader
            title={t('dashboard.recentActivity')}
            subtitle={t('dashboard.recentActivitySubtitle')}
          />
        </div>
        <div className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
          {recentActivities?.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">{t('dashboard.noRecentActivities')}</p>
          )}
          {paginatedActivities.map((activity) => {
            const Icon = activityIcons[activity.type] || StickyNote;
            return (
              <div key={activity.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <div className="shrink-0 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-medium capitalize">
                        {t(`activityType.${activity.type}`, { defaultValue: activity.type })}
                      </span>
                      {' — '}
                      {contactName(activity.contact)}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400 sm:text-right">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm leading-relaxed text-slate-500">
                    {activity.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {showActivityPagination && (
          <Pagination
            page={activityPage}
            pageSize={activityPageSize}
            totalItems={recentActivities.length}
            onPageChange={setActivityPage}
            onPageSizeChange={(size) => {
              setActivityPageSize(size);
              setActivityPage(1);
            }}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        )}
      </Card>

      <ForecastWidget />
    </div>
  );
}
