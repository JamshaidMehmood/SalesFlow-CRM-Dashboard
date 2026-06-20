import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Briefcase, Activity, ArrowRight } from 'lucide-react';
import { searchApi } from '../../api';
import { cn, contactName, formatCurrency } from '../../utils/helpers';

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function ResultGroup({ title, icon: Icon, items, renderItem, seeAllHref, total, onClose, t }) {
  if (!items?.length) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h3>
        {total > items.length && seeAllHref && (
          <Link
            to={seeAllHref}
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
          >
            {t('search.seeAllCount', { count: total })}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="space-y-1">{items.map(renderItem)}</div>
    </div>
  );
}

export default function GlobalSearch({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchApi.query(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const go = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose]
  );

  if (!open) return null;

  const encodedQuery = encodeURIComponent(debouncedQuery);
  const hasResults =
    data?.contacts?.length || data?.deals?.length || data?.activities?.length;
  const showEmpty = debouncedQuery.length >= 2 && !isFetching && !hasResults;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline dark:border-slate-700">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          {query.length < 2 && (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('search.typeMinChars')}
            </p>
          )}

          {isFetching && debouncedQuery.length >= 2 && (
            <p className="px-2 py-6 text-center text-sm text-slate-500">{t('search.searching')}</p>
          )}

          {showEmpty && (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('search.noResults')} &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          {hasResults && (
            <div className="space-y-4">
              <ResultGroup
                title={t('search.contacts')}
                icon={Users}
                items={data.contacts}
                total={data.totals.contacts}
                seeAllHref={`/contacts?search=${encodedQuery}`}
                onClose={onClose}
                t={t}
                renderItem={(contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => go(`/contacts/${contact.id}`)}
                    className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {contactName(contact)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {contact.email}
                      {contact.company ? ` · ${contact.company}` : ''}
                    </span>
                  </button>
                )}
              />

              <ResultGroup
                title={t('search.deals')}
                icon={Briefcase}
                items={data.deals}
                total={data.totals.deals}
                seeAllHref={`/pipeline?q=${encodedQuery}`}
                onClose={onClose}
                t={t}
                renderItem={(deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => go(`/contacts/${deal.contactId}`)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {deal.title}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {contactName(deal.contact)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-brand-500">
                      {formatCurrency(deal.value)}
                    </span>
                  </button>
                )}
              />

              <ResultGroup
                title={t('search.activities')}
                icon={Activity}
                items={data.activities}
                total={data.totals.activities}
                seeAllHref={`/activities?search=${encodedQuery}`}
                onClose={onClose}
                t={t}
                renderItem={(activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => go(`/contacts/${activity.contactId}`)}
                    className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                      {activity.type} — {contactName(activity.contact)}
                    </span>
                    <span className="truncate text-xs text-slate-500">{activity.content}</span>
                  </button>
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger({ onClick, className }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800',
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t('search.placeholder')}</span>
      <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] sm:inline dark:border-slate-600">
        ⌘K
      </kbd>
    </button>
  );
}
