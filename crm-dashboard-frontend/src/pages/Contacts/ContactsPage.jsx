import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, ArrowUpDown, Pencil, Trash2, Eye, Upload, Download } from 'lucide-react';
import { contactsApi, tagsApi, leadSourcesApi, customFieldsApi, territoriesApi } from '../../api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import { Select } from '../../components/common/Input';
import ContactFormModal from '../../components/contacts/ContactFormModal';
import ImportContactsModal from '../../components/contacts/ImportContactsModal';
import ScoreBadge from '../../components/contacts/ScoreBadge';
import TagPill from '../../components/contacts/TagPill';
import { PageLoader, EmptyState } from '../../components/common/LoadingSpinner';
import {
  contactName,
  formatDate,
  STATUS_COLORS,
} from '../../utils/helpers';

const SORT_OPTION_KEYS = [
  { value: 'createdAt', labelKey: 'contacts.createdDate' },
  { value: 'firstName', labelKey: 'contacts.firstName' },
  { value: 'lastName', labelKey: 'contacts.lastName' },
  { value: 'email', labelKey: 'common.email' },
  { value: 'company', labelKey: 'common.company' },
  { value: 'status', labelKey: 'common.status' },
  { value: 'owner', labelKey: 'common.owner' },
  { value: 'score', labelKey: 'contacts.leadScore' },
  { value: 'scoreTier', labelKey: 'contacts.scoreTier' },
];

const PAGE_SIZE_DEFAULT = 10;
const EMAIL_DISPLAY_MAX = 20;

function truncateEmail(email, max = EMAIL_DISPLAY_MAX) {
  if (!email) return '—';
  if (email.length <= max) return email;
  return `${email.slice(0, max)}...`;
}

export default function ContactsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState('');
  const [scoreTier, setScoreTier] = useState('');
  const [leadSourceId, setLeadSourceId] = useState('');
  const [territoryId, setTerritoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [search, status, scoreTier, leadSourceId, territoryId, selectedTagIds, sortBy, sortOrder]);

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: leadSourcesApi.getAll,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: customFieldsApi.getAll,
  });

  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: territoriesApi.getAll,
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', search, status, scoreTier, leadSourceId, territoryId, selectedTagIds, sortBy, sortOrder],
    queryFn: () =>
      contactsApi.getAll({
        search: search || undefined,
        status: status || undefined,
        scoreTier: scoreTier || undefined,
        leadSourceId: leadSourceId || undefined,
        territoryId: territoryId || undefined,
        tags: selectedTagIds.length ? selectedTagIds.join(',') : undefined,
        sortBy,
        sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const handleEdit = (contact) => {
    setEditContact(contact);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditContact(null);
    setModalOpen(true);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const paginatedContacts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return contacts.slice(start, start + pageSize);
  }, [contacts, page, pageSize]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleExport = async () => {
    const blob = await contactsApi.exportCsv({
      search: search || undefined,
      status: status || undefined,
      scoreTier: scoreTier || undefined,
      leadSourceId: leadSourceId || undefined,
      territoryId: territoryId || undefined,
      tags: selectedTagIds.length ? selectedTagIds.join(',') : undefined,
      sortBy,
      sortOrder,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTagFilter = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('contacts.title')}</h1>
          <p className="mt-1 text-slate-500">
            {t('contacts.contactsCount', { count: contacts.length })} ·{' '}
            <Link to="/contacts/duplicates" className="text-brand-500 hover:underline">
              {t('contacts.reviewDuplicates')}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            {t('contacts.import')}
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('contacts.export')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            {t('contacts.addContact')}
          </Button>
        </div>
      </div>

      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('contacts.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-40"
          >
            <option value="">{t('contacts.allStatuses')}</option>
            <option value="lead">{t('status.lead')}</option>
            <option value="prospect">{t('status.prospect')}</option>
            <option value="customer">{t('status.customer')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </Select>
          <Select
            value={leadSourceId}
            onChange={(e) => setLeadSourceId(e.target.value)}
            className="sm:w-40"
          >
            <option value="">{t('contacts.allSources')}</option>
            {leadSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            value={scoreTier}
            onChange={(e) => setScoreTier(e.target.value)}
            className="sm:w-36"
          >
            <option value="">{t('contacts.allScores')}</option>
            <option value="hot">{t('scoreTier.hot')}</option>
            <option value="warm">{t('scoreTier.warm')}</option>
            <option value="cold">{t('scoreTier.cold')}</option>
          </Select>
          <Select
            value={territoryId}
            onChange={(e) => setTerritoryId(e.target.value)}
            className="sm:w-40"
          >
            <option value="">{t('contacts.allTerritories')}</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <div className="relative sm:w-44">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleTagFilter(e.target.value);
                e.target.value = '';
              }}
              className="w-full"
            >
              <option value="">
                {selectedTagIds.length
                  ? t('contacts.tagsSelected', { count: selectedTagIds.length })
                  : t('contacts.filterByTag')}
              </option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {selectedTagIds.includes(tag.id) ? '✓ ' : ''}{tag.name}
                </option>
              ))}
            </Select>
          </div>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sm:w-44"
          >
            {SORT_OPTION_KEYS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t('contacts.sortPrefix')}: {t(opt.labelKey)}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? t('contacts.asc') : t('contacts.desc')}
          </Button>
        </div>

        {selectedTagIds.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            {selectedTagIds.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTagFilter(tag.id)}
                  className="inline-flex items-center gap-1"
                >
                  <TagPill tag={tag} />
                  <span className="text-xs text-slate-400">×</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedTagIds([])}
              className="text-xs text-brand-500 hover:underline"
            >
              {t('contacts.clearTags')}
            </button>
          </div>
        )}

        {contacts.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('contacts.noContacts')}
            description={t('contacts.tryAdjustingFilters')}
            action={<Button onClick={handleAdd}>{t('contacts.addContact')}</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  {[
                    t('contacts.firstName'),
                    t('common.email'),
                    t('common.company'),
                    t('contacts.tags'),
                    t('common.status'),
                    t('contacts.leadScore'),
                    t('common.owner'),
                    t('contacts.created'),
                    t('common.actions'),
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400"
                    >
                      {[
                        t('contacts.firstName'),
                        t('common.email'),
                        t('common.company'),
                        t('common.status'),
                        t('contacts.leadScore'),
                        t('common.owner'),
                        t('contacts.created'),
                      ].includes(col) ? (
                        <button
                          className="flex items-center gap-1 hover:text-brand-500"
                          onClick={() =>
                            toggleSort(
                              col === t('contacts.firstName')
                                ? 'firstName'
                                : col === t('contacts.created')
                                  ? 'createdAt'
                                  : col === t('common.owner')
                                    ? 'owner'
                                    : col === t('contacts.leadScore')
                                      ? 'score'
                                      : col === t('common.email')
                                        ? 'email'
                                        : col === t('common.company')
                                          ? 'company'
                                          : 'status'
                            )
                          }
                        >
                          {col}
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      ) : (
                        col
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="font-medium text-brand-500 hover:text-brand-600"
                      >
                        {contactName(contact)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <span title={contact.email} className="cursor-default">
                        {truncateEmail(contact.email)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {contact.company || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(contact.tags || []).length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          contact.tags.map((tag) => <TagPill key={tag.id} tag={tag} />)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge colorClass={STATUS_COLORS[contact.status]}>
                        {t(`status.${contact.status}`, { defaultValue: contact.status })}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge tier={contact.scoreTier} score={contact.score} showScore />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {contact.owner?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/contacts/${contact.id}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(contact)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('contacts.deleteConfirm'))) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {contacts.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={contacts.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Card>

      <ContactFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditContact(null);
        }}
        contact={editContact}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
      />

      <ImportContactsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        leadSources={leadSources}
        customFields={customFields}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
      />
    </div>
  );
}
