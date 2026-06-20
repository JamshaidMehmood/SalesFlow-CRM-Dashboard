import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../common/Card';
import { cn } from '../../utils/helpers';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendLabel }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-400';

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
            <Icon className="h-6 w-6 text-brand-500" />
          </div>
        )}
      </div>
    </Card>
  );
}
