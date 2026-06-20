import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import EntityHistory from '../audit/EntityHistory';
import { formatCurrency, contactName } from '../../utils/helpers';

function DealDetailModal({ deal, open, onClose }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('details');

  if (!deal) return null;

  return (
    <Modal open={open} onClose={onClose} title={deal.title} size="lg">
      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {['details', 'history'].map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === tabKey
                ? 'border-b-2 border-brand-500 text-brand-500'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tabKey === 'history' ? t('common.history') : t('common.details')}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('pipeline.value')}</dt>
            <dd className="font-semibold text-brand-500">{formatCurrency(deal.value)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('activities.contact')}</dt>
            <dd className="text-slate-900 dark:text-white">
              {deal.contact ? contactName(deal.contact) : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('common.stage')}</dt>
            <dd className="text-slate-900 dark:text-white">{deal.stage?.name || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('common.owner')}</dt>
            <dd className="text-slate-900 dark:text-white">{deal.owner?.name || '—'}</dd>
          </div>
        </dl>
      ) : (
        <EntityHistory entityType="deal" entityId={deal.id} />
      )}
    </Modal>
  );
}

export default DealDetailModal;
