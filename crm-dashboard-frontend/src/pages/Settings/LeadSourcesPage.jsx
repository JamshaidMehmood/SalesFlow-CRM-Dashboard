import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { leadSourcesApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';

export default function LeadSourcesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['lead-sources-admin'],
    queryFn: leadSourcesApi.getAllAdmin,
  });

  const createMutation = useMutation({
    mutationFn: leadSourcesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      queryClient.invalidateQueries({ queryKey: ['lead-sources-admin'] });
      setModalOpen(false);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: leadSourcesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      queryClient.invalidateQueries({ queryKey: ['lead-sources-admin'] });
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.leadSources')}</h1>
          <p className="mt-1 text-slate-500">{t('settings.leadSourcesSubtitle')}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('settings.addSource')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{source.name}</p>
                {!source.isActive && (
                  <span className="text-xs text-slate-400">{t('common.inactive')}</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(t('settings.removeLeadSourceConfirm', { name: source.name }))) {
                    deleteMutation.mutate(source.id);
                  }
                }}
                className="rounded p-1.5 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('settings.addLeadSource')}>
        <div className="space-y-4">
          <Input label={t('settings.sourceName')} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate({ name })}
              loading={createMutation.isPending}
              disabled={!name.trim()}
            >
              {t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
