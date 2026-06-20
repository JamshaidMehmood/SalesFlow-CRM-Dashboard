import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, Calendar, StickyNote, Plus } from 'lucide-react';
import { activitiesApi, contactsApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Input, { Select, Textarea } from '../../components/common/Input';
import { PageLoader, EmptyState } from '../../components/common/LoadingSpinner';
import { formatDateTime, contactName } from '../../utils/helpers';
import { Link, useSearchParams } from 'react-router-dom';

const TYPE_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

const TYPE_COLORS = {
  call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  meeting: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  note: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const PAGE_SIZE_DEFAULT = 10;

export default function ActivitiesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, search]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', typeFilter],
    queryFn: () => activitiesApi.getAll({ type: typeFilter || undefined }),
  });

  const filteredActivities = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.content.toLowerCase().includes(q) ||
        contactName(a.contact).toLowerCase().includes(q)
    );
  }, [activities, search]);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.getAll({}),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { contactId: '', type: 'call', content: '' },
  });

  const createMutation = useMutation({
    mutationFn: activitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      reset();
      setModalOpen(false);
    },
  });

  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, page, pageSize]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('activities.title')}</h1>
          <p className="mt-1 text-slate-500">
            {t('activities.activitiesLogged', { count: filteredActivities.length })}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={t('activities.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          >
            <option value="">{t('activities.allTypes')}</option>
            <option value="call">{t('activities.calls')}</option>
            <option value="email">{t('activities.emails')}</option>
            <option value="meeting">{t('activities.meetings')}</option>
            <option value="note">{t('activities.notes')}</option>
          </Select>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('activities.logActivity')}
          </Button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={Phone}
          title={t('activities.noActivities')}
          description={t('activities.noActivitiesDesc')}
          action={<Button onClick={() => setModalOpen(true)}>{t('activities.logActivity')}</Button>}
        />
      ) : (
        <Card padding={false}>
          <div className="space-y-3 p-4">
            {paginatedActivities.map((activity) => {
              const Icon = TYPE_ICONS[activity.type] || StickyNote;
              return (
                <Card key={activity.id} className="!p-4">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2.5 ${TYPE_COLORS[activity.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium capitalize text-slate-900 dark:text-white">
                          {t(`activityType.${activity.type}`, { defaultValue: activity.type })}
                        </span>
                        <span className="text-slate-400">·</span>
                        <Link
                          to={`/contacts/${activity.contact?.id}`}
                          className="text-sm text-brand-500 hover:underline"
                        >
                          {contactName(activity.contact)}
                        </Link>
                        {activity.contact?.company && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-sm text-slate-500">{activity.contact.company}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {activity.content}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {activity.user?.name} · {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredActivities.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('activities.logActivityTitle')}>
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Select
            label={t('activities.contact')}
            {...register('contactId', { required: t('activities.selectContactRequired') })}
            error={errors.contactId?.message}
          >
            <option value="">{t('activities.selectContact')}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {contactName(c)} {c.company ? `— ${c.company}` : ''}
              </option>
            ))}
          </Select>
          <Select label={t('activities.type')} {...register('type')}>
            <option value="call">{t('activityType.call')}</option>
            <option value="email">{t('activityType.email')}</option>
            <option value="meeting">{t('activityType.meeting')}</option>
            <option value="note">{t('activityType.note')}</option>
          </Select>
          <Textarea
            label={t('activities.description')}
            placeholder={t('activities.descriptionPlaceholder')}
            {...register('content', { required: t('activities.descriptionRequired') })}
            error={errors.content?.message}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('activities.logActivity')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
