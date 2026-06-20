import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal } from 'lucide-react';
import { leaderboardApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatCurrency, getInitials, cn } from '../../utils/helpers';

const RANK_STYLES = {
  1: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  2: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
  3: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
};

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [metric, setMetric] = useState('revenue');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', metric],
    queryFn: () => leaderboardApi.get({ metric }),
  });

  if (isLoading) return <PageLoader />;

  const entries = data?.entries || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('leaderboard.title')}</h1>
          <p className="mt-1 text-slate-500">{t('leaderboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={metric === 'revenue' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMetric('revenue')}
          >
            {t('leaderboard.revenue')}
          </Button>
          <Button
            variant={metric === 'deals' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMetric('deals')}
          >
            {t('leaderboard.dealsClosed')}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === user?.id;
          const isTop3 = entry.rank <= 3;
          const displayValue =
            metric === 'revenue' ? formatCurrency(entry.value) : t('leaderboard.dealsCount', { count: entry.value });

          return (
            <Card
              key={entry.userId}
              className={cn(
                'border-2 transition-all duration-300',
                RANK_STYLES[entry.rank],
                isCurrentUser && isTop3 && 'ring-2 ring-brand-500/40 scale-[1.01]',
                isCurrentUser && !isTop3 && 'ring-2 ring-brand-500/30'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {entry.rank <= 3 ? (
                    <Medal className={cn('h-5 w-5', entry.rank === 1 && 'text-amber-200')} />
                  ) : (
                    `#${entry.rank}`
                  )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                  {getInitials(entry.name)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {entry.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-normal text-brand-500">{t('leaderboard.you')}</span>
                    )}
                  </p>
                  {isTop3 && (
                    <p className="text-xs text-slate-500">
                      {entry.rank === 1 ? `🥇 ${t('leaderboard.topPerformer')}` : entry.rank === 2 ? `🥈 ${t('leaderboard.runnerUp')}` : `🥉 ${t('leaderboard.thirdPlace')}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{displayValue}</p>
                </div>
              </div>
            </Card>
          );
        })}

        {entries.length === 0 && (
          <Card className="py-12 text-center text-slate-500">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            {t('leaderboard.noClosedDeals')}
          </Card>
        )}
      </div>
    </div>
  );
}
