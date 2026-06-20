import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GitMerge } from 'lucide-react';
import { contactsApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { contactName } from '../../utils/helpers';

function MergeModal({ open, onClose, survivor, merged, onMerged }) {
  const { t } = useTranslation();
  const [choices, setChoices] = useState({});
  const queryClient = useQueryClient();

  const { data: preview } = useQuery({
    queryKey: ['merge-preview', survivor?.id, merged?.id],
    queryFn: () => contactsApi.getMergePreview(survivor.id, merged.id),
    enabled: open && !!survivor && !!merged,
  });

  const mergeMutation = useMutation({
    mutationFn: () =>
      contactsApi.merge({
        survivorId: survivor.id,
        mergedId: merged.id,
        fieldChoices: choices,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-duplicates'] });
      onMerged();
      onClose();
    },
  });

  if (!open || !survivor || !merged) return null;

  const fields = preview?.fields || [];

  return (
    <Modal open={open} onClose={onClose} title={t('settings.mergeContacts')} size="lg">
      <p className="mb-4 text-sm text-slate-500">
        {t('settings.mergeContactsDesc')}
      </p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field} className="grid grid-cols-3 gap-3 rounded-lg border p-3 dark:border-slate-800">
            <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
              {field.replace(/([A-Z])/g, ' $1')}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field}
                checked={(choices[field] || 'survivor') === 'survivor'}
                onChange={() => setChoices({ ...choices, [field]: 'survivor' })}
              />
              {String(preview?.survivor?.[field] ?? '—')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field}
                checked={choices[field] === 'merged'}
                onChange={() => setChoices({ ...choices, [field]: 'merged' })}
              />
              {String(preview?.merged?.[field] ?? '—')}
            </label>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button loading={mergeMutation.isPending} onClick={() => mergeMutation.mutate()}>
          {t('settings.mergeContacts')}
        </Button>
      </div>
    </Modal>
  );
}

export default function DuplicatesPage() {
  const { t } = useTranslation();
  const [mergePair, setMergePair] = useState(null);

  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ['contact-duplicates'],
    queryFn: contactsApi.getDuplicates,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.duplicateContacts')}</h1>
        <p className="mt-1 text-slate-500">
          {t('settings.duplicatesSubtitle')}
        </p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-500">{t('settings.noDuplicateGroups')}</p>
        </Card>
      ) : (
        groups.map((group, idx) => (
          <Card key={idx}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {t('settings.matchBy', { type: group.matchType })}: {group.matchValue}
              </h3>
              <span className="text-xs text-slate-500">
                {t('settings.settingsContactsCount', { count: group.contacts.length })}
              </span>
            </div>
            <div className="space-y-2">
              {group.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <Link to={`/contacts/${contact.id}`} className="font-medium text-brand-500">
                      {contactName(contact)}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {contact.email} · {contact.owner?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {group.contacts.length >= 2 && (
              <Button
                size="sm"
                className="mt-3"
                variant="secondary"
                onClick={() =>
                  setMergePair({ survivor: group.contacts[0], merged: group.contacts[1] })
                }
              >
                <GitMerge className="h-4 w-4" />
                {t('settings.mergeFirstTwo')}
              </Button>
            )}
          </Card>
        ))
      )}

      <MergeModal
        open={!!mergePair}
        onClose={() => setMergePair(null)}
        survivor={mergePair?.survivor}
        merged={mergePair?.merged}
        onMerged={() => refetch()}
      />
    </div>
  );
}
