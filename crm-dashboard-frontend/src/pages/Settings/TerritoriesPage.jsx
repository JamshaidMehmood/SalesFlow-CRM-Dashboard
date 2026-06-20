import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { territoriesApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input, { Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';

export default function TerritoriesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTerritory, setEditTerritory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: territories = [], isLoading } = useQuery({
    queryKey: ['territories'],
    queryFn: territoriesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: territoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => territoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: territoriesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['territories'] }),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditTerritory(null);
    setName('');
    setDescription('');
  };

  const openCreate = () => {
    setEditTerritory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (territory) => {
    setEditTerritory(territory);
    setName(territory.name);
    setDescription(territory.description || '');
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = { name, description: description || null };
    if (editTerritory) {
      updateMutation.mutate({ id: editTerritory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.territories')}</h1>
          <p className="mt-1 text-slate-500">{t('settings.territoriesDesc')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('settings.addTerritory')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {territories.map((territory) => (
            <div key={territory.id} className="flex items-start justify-between gap-4 p-4">
              <div className="flex gap-3">
                <div className="rounded-lg bg-teal-100 p-2 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{territory.name}</p>
                  {territory.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{territory.description}</p>
                  )}
                  <Badge colorClass="mt-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t('settings.settingsContactsCount', { count: territory._count?.contacts ?? 0 })}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(territory)}
                  className="rounded p-1.5 text-slate-400 hover:text-brand-500"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('settings.deleteTerritoryConfirm', { name: territory.name }))) {
                      deleteMutation.mutate(territory.id);
                    }
                  }}
                  className="rounded p-1.5 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {territories.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">{t('settings.noTerritoriesYet')}</p>
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTerritory ? t('settings.editTerritory') : t('settings.createTerritory')}
      >
        <div className="space-y-4">
          <Input label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label={t('common.description')}
            placeholder={t('settings.descriptionOptional')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editTerritory ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
