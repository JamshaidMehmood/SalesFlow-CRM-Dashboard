import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotasApi } from '../../api';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';

export default function QuotasPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [edits, setEdits] = useState({});

  const { data: quotas = [], isLoading } = useQuery({
    queryKey: ['quotas', month, year],
    queryFn: () => quotasApi.getAll({ month, year }),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['quota-progress', month, year],
    queryFn: () => quotasApi.getProgress({ month, year }),
  });

  const saveMutation = useMutation({
    mutationFn: quotasApi.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas'] });
      queryClient.invalidateQueries({ queryKey: ['quota-progress'] });
    },
  });

  if (isLoading) return <PageLoader />;

  const progressMap = Object.fromEntries((progress || []).map((p) => [p.userId, p]));
  const monthLabel = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.salesQuotas')}</h1>
        <p className="mt-1 text-slate-500">
          {t('settings.quotasMonthSubtitle', { month: monthLabel })}
        </p>
      </div>

      <Card>
        <CardHeader title={t('settings.monthlyTargets')} subtitle={t('settings.monthlyTargetsSubtitle')} />
        <div className="space-y-4">
          {quotas.map((quota) => {
            const prog = progressMap[quota.userId];
            return (
              <div key={quota.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{quota.user.name}</p>
                    <p className="text-xs text-slate-500">
                      {t('settings.currentAmount', { amount: formatCurrency(prog?.currentAmount || 0) })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    label={t('settings.targetAmount')}
                    value={edits[quota.userId] ?? quota.targetAmount}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [quota.userId]: Number(e.target.value) }))
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      loading={saveMutation.isPending}
                      onClick={() =>
                        saveMutation.mutate({
                          userId: quota.userId,
                          month,
                          year,
                          targetAmount: edits[quota.userId] ?? quota.targetAmount,
                        })
                      }
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
