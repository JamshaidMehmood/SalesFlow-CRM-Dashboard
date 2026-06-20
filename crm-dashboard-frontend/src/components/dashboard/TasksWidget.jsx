import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card, { CardHeader } from '../common/Card';
import { tasksApi } from '../../api';
import { contactName, formatDate, cn } from '../../utils/helpers';

const DEFAULT_VISIBLE = 3;

function TaskRow({ task, overdue, t }) {
  const queryClient = useQueryClient();
  const completeMutation = useMutation({
    mutationFn: () => tasksApi.update(task.id, { status: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
    },
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2',
        overdue
          ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'
          : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
      )}
    >
      <button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="mt-0.5 text-slate-400 hover:text-brand-500"
        aria-label={t('contactDetail.markDone')}
      >
        <Circle className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
        <p className="text-xs text-slate-500">
          <Link to={`/contacts/${task.contact?.id}`} className="text-brand-500 hover:underline">
            {contactName(task.contact)}
          </Link>
          {' · '}
          {t('dashboard.due')} {formatDate(task.dueDate)}
        </p>
      </div>
    </div>
  );
}

function TaskGroup({ title, tasks, overdue, t }) {
  const [expanded, setExpanded] = useState(false);

  if (!tasks?.length) return null;

  const hasMore = tasks.length > DEFAULT_VISIBLE;
  const visibleTasks = expanded ? tasks : tasks.slice(0, DEFAULT_VISIBLE);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            overdue ? 'text-red-600' : 'text-slate-500'
          )}
        >
          {title} ({tasks.length})
        </h4>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
            aria-label={expanded ? t('dashboard.showLess') : t('dashboard.showMore')}
          >
            {expanded ? (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                {t('dashboard.showLess')}
              </>
            ) : (
              <>
                {t('dashboard.showMore')}
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <TaskRow key={task.id} task={task} overdue={overdue} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function TasksWidget({ tasks }) {
  const { t } = useTranslation();

  if (!tasks) return null;
  const total =
    (tasks.overdue?.length || 0) + (tasks.today?.length || 0) + (tasks.upcoming?.length || 0);

  return (
    <Card className="h-fit">
      <CardHeader
        title={t('dashboard.tasksReminders')}
        subtitle={t('dashboard.pendingTasks', { count: total })}
      />
      {total === 0 ? (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          {t('dashboard.allCaughtUp')}
        </div>
      ) : (
        <div className="space-y-3">
          <TaskGroup title={t('dashboard.overdue')} tasks={tasks.overdue} overdue t={t} />
          <TaskGroup title={t('dashboard.today')} tasks={tasks.today} t={t} />
          <TaskGroup title={t('dashboard.upcoming')} tasks={tasks.upcoming} t={t} />
        </div>
      )}
    </Card>
  );
}
