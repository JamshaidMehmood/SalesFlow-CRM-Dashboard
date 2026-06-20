import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Filter } from 'lucide-react';
import { auditLogsApi, authApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import Pagination from '../../components/common/Pagination';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDateTime, cn } from '../../utils/helpers';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  merge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const entityTypes = [
    { value: '', labelKey: 'settings.allTypes' },
    { value: 'contact', labelKey: 'settings.entityContact' },
    { value: 'deal', labelKey: 'settings.entityDeal' },
  ];

  const { data: users = [] } = useQuery({
    queryKey: ['auth-users'],
    queryFn: authApi.getUsers,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize, entityType, actorId, from, to],
    queryFn: () =>
      auditLogsApi.getAll({
        page,
        pageSize,
        entityType: entityType || undefined,
        actorId: actorId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const resetFilters = () => {
    setEntityType('');
    setActorId('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  if (isLoading && !data) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.auditLog')}</h1>
        <p className="mt-1 text-slate-500">{t('settings.auditLogSubtitle')}</p>
      </div>

      <Card padding={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <Select
            label={t('settings.entityType')}
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            {entityTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </Select>
          <Select
            label={t('settings.actor')}
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">{t('settings.allUsers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('common.from')}
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.to')}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            <Filter className="h-4 w-4" />
            {t('common.reset')}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-4 py-3">{t('common.time')}</th>
                <th className="px-4 py-3">{t('settings.actor')}</th>
                <th className="px-4 py-3">{t('common.action')}</th>
                <th className="px-4 py-3">{t('common.entity')}</th>
                <th className="px-4 py-3">{t('common.summary')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <ScrollText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2">{t('settings.noAuditEntries')}</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {log.actor?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          ACTION_COLORS[log.action] || ACTION_COLORS.update
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                      {log.entityType}
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        {log.entityId.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </Card>
    </div>
  );
}
