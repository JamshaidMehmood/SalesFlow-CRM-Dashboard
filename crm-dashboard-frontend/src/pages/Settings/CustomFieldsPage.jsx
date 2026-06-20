import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { customFieldsApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input, { Select } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';

const FIELD_TYPE_KEYS = {
  text: 'settings.fieldTypeText',
  number: 'settings.fieldTypeNumber',
  select: 'settings.fieldTypeSelect',
  date: 'settings.fieldTypeDate',
};

export default function CustomFieldsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  const [form, setForm] = useState({
    label: '',
    fieldType: 'text',
    options: '',
    isRequired: false,
  });

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: customFieldsApi.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editField ? customFieldsApi.update(editField.id, data) : customFieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setModalOpen(false);
      setEditField(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: customFieldsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields'] }),
  });

  const openCreate = () => {
    setEditField(null);
    setForm({ label: '', fieldType: 'text', options: '', isRequired: false });
    setModalOpen(true);
  };

  const openEdit = (field) => {
    setEditField(field);
    setForm({
      label: field.label,
      fieldType: field.fieldType,
      options: Array.isArray(field.options) ? field.options.join(', ') : '',
      isRequired: field.isRequired,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      label: form.label,
      fieldType: form.fieldType,
      isRequired: form.isRequired,
      options:
        form.fieldType === 'select'
          ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
          : null,
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.customFields')}</h1>
          <p className="mt-1 text-slate-500">{t('settings.customFieldsSubtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('settings.addField')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {field.label}
                  {field.isRequired && <span className="text-red-500"> *</span>}
                </p>
                <p className="text-xs capitalize text-slate-500">
                  {t(FIELD_TYPE_KEYS[field.fieldType] || 'settings.fieldTypeText')}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(field)} className="rounded p-1.5 text-slate-400 hover:text-brand-500">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('settings.archiveFieldConfirm', { label: field.label }))) {
                      deleteMutation.mutate(field.id);
                    }
                  }}
                  className="rounded p-1.5 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editField ? t('settings.editField') : t('settings.addField')}>
        <div className="space-y-4">
          <Input label={t('common.name')} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Select
            label={t('settings.fieldType')}
            value={form.fieldType}
            onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
          >
            {Object.entries(FIELD_TYPE_KEYS).map(([value, labelKey]) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </Select>
          {form.fieldType === 'select' && (
            <Input
              label={t('settings.optionsCommaSeparated')}
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
            />
            {t('settings.requiredField')}
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saveMutation.isPending} disabled={!form.label.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
