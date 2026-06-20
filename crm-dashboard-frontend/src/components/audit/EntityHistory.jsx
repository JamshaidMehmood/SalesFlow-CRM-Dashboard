import { useQuery } from '@tanstack/react-query';
import { History, User } from 'lucide-react';
import { auditLogsApi } from '../../api';
import { formatDateTime, cn } from '../../utils/helpers';
import { PageLoader } from '../common/LoadingSpinner';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  merge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  reassign: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

function ChangeDetail({ changes }) {
  if (!changes || !Object.keys(changes).length) return null;

  return (
    <dl className="mt-2 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50">
      {Object.entries(changes).map(([field, diff]) => (
        <div key={field} className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-slate-500">{field}:</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            {String(diff.before ?? '—')} → {String(diff.after ?? '—')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function EntityHistory({ entityType, entityId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, entityId],
    queryFn: () => auditLogsApi.getEntityHistory(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  if (isLoading) return <PageLoader />;

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <History className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm text-slate-500">No change history yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-0">
        {logs.map((log, idx) => (
          <div key={log.id} className="relative flex gap-4 pb-8">
            {idx < logs.length - 1 && (
              <div className="absolute left-4 top-8 h-full w-px bg-slate-200 dark:bg-slate-700" />
            )}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <History className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    ACTION_COLORS[log.action] || ACTION_COLORS.update
                  )}
                >
                  {log.action}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {log.summary}
                </span>
                <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
              </div>
              {log.actor && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <User className="h-3 w-3" />
                  {log.actor.name}
                </p>
              )}
              <ChangeDetail changes={log.changes} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
