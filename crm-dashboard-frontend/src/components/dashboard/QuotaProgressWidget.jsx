import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Card, { CardHeader } from '../common/Card';
import { quotasApi } from '../../api';
import { formatCurrency, cn } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

function ProgressBar({ label, current, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
        <span className="min-w-0 break-words font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="shrink-0 text-xs text-slate-500">
          {formatCurrency(current)} / {formatCurrency(target)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-brand-500' : 'bg-amber-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-right text-xs text-slate-400">{pct}%</p>
    </div>
  );
}

export default function QuotaProgressWidget() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['quota-progress'],
    queryFn: () => quotasApi.getProgress(),
  });

  if (isLoading) return null;

  const items = isAdmin ? (Array.isArray(data) ? data : []) : data ? [data] : [];
  const activeItems = items.filter((i) => i.targetAmount > 0);

  return (
    <Card className="h-fit">
      <CardHeader
        title={t('dashboard.salesTargets')}
        subtitle={isAdmin ? t('dashboard.quotaProgressAdmin') : t('dashboard.quotaProgressRep')}
      />
      {activeItems.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">{t('dashboard.noQuotaSet')}</p>
      ) : (
        <div className="space-y-3">
          {activeItems.map((item) => (
            <ProgressBar
              key={item.userId}
              label={isAdmin ? item.name : t('dashboard.yourQuota')}
              current={item.currentAmount}
              target={item.targetAmount}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
