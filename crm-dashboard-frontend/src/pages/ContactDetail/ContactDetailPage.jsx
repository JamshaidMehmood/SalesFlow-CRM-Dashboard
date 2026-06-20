import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  PhoneCall,
  StickyNote,
  Plus,
  Circle,
  CheckCircle2,
  ListTodo,
  History,
} from 'lucide-react';
import { contactsApi, notesApi, tasksApi, customFieldsApi } from '../../api';
import Card, { CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { PageLoader } from '../../components/common/LoadingSpinner';
import ScoreBadge from '../../components/contacts/ScoreBadge';
import AttachmentsSection from '../../components/contacts/AttachmentsSection';
import TagPill from '../../components/contacts/TagPill';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import EntityHistory from '../../components/audit/EntityHistory';
import {
  contactName,
  formatDate,
  formatDateTime,
  formatCurrency,
  STATUS_COLORS,
  LOST_REASON_LABELS,
  getStageColor,
  getInitials,
  cn,
} from '../../utils/helpers';

function ContactTaskRow({ task, t }) {
  const queryClient = useQueryClient();
  const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.update(task.id, { status: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        isOverdue
          ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'
          : 'border-slate-100 dark:border-slate-800'
      )}
    >
      <button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="mt-0.5 text-slate-400 hover:text-brand-500"
        aria-label={t('contactDetail.markDone')}
      >
        <Circle className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
        <p className={cn('text-xs', isOverdue ? 'text-red-600' : 'text-slate-500')}>
          {t('dashboard.due')} {formatDate(task.dueDate)}
          {isOverdue && ` · ${t('contactDetail.overdue')}`}
        </p>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getById(id),
  });

  const { data: fieldDefinitions = [] } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: customFieldsApi.getAll,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) => notesApi.create(id, { content }),
    onSuccess: () => {
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (data) => tasksApi.create({ ...data, contactId: id }),
    onSuccess: () => {
      setTaskModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{t('contactDetail.contactNotFound')}</p>
        <Link to="/contacts" className="mt-4 inline-block text-brand-500">
          {t('contactDetail.backToContacts')}
        </Link>
      </div>
    );
  }

  const timeline = [
    ...(contact.notes || []).map((n) => ({ ...n, itemType: 'note' })),
    ...(contact.activities || []).map((a) => ({ ...a, itemType: 'activity' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingTasks = contact.tasks || [];

  return (
    <div className="space-y-6">
      <Link
        to="/contacts"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('contactDetail.backToContacts')}
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/3 space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
                {getInitials(contactName(contact))}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {contactName(contact)}
                </h1>
                <p className="text-slate-500">{contact.jobTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge colorClass={STATUS_COLORS[contact.status]}>
                    {t(`status.${contact.status}`, { defaultValue: contact.status })}
                  </Badge>
                  <ScoreBadge tier={contact.scoreTier} score={contact.score} showScore />
                  {contact.leadSource && (
                    <Badge colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {contact.leadSource.name}
                    </Badge>
                  )}
                </div>
                {(contact.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <TagPill key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${contact.email}`} className="text-brand-500 hover:underline">
                  {contact.email}
                </a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>{contact.company}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-slate-400" />
                <span>{t('common.owner')}: {contact.owner?.name}</span>
              </div>
            </div>

            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('contactDetail.customFields')}
                </p>
                <dl className="space-y-2">
                  {fieldDefinitions
                    .filter((field) => contact.customFields[field.id])
                    .map((field) => (
                      <div key={field.id} className="flex justify-between gap-4 text-sm">
                        <dt className="text-slate-500">{field.label}</dt>
                        <dd className="text-right font-medium text-slate-900 dark:text-white">
                          {contact.customFields[field.id] || '—'}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </Card>

          <AttachmentsSection contactId={id} />

          <Card>
            <CardHeader
              title={t('contactDetail.tasksReminders')}
              action={
                <Button size="sm" onClick={() => setTaskModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {t('contactDetail.addTask')}
                </Button>
              }
            />
            {pendingTasks.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {t('contactDetail.noPendingTasks')}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <ContactTaskRow key={task.id} task={task} t={t} />
                ))}
              </div>
            )}
          </Card>

          {contact.deals?.length > 0 && (
            <Card>
              <CardHeader title={t('contactDetail.relatedDeals')} />
              <div className="space-y-3">
                {contact.deals.map((deal, index) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{deal.title}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(deal.value)}</p>
                      </div>
                      <Badge colorClass={getStageColor(deal.stage, index)}>
                        {deal.stage?.name || t('contactDetail.unknown')}
                      </Badge>
                    </div>
                    {deal.stage?.isLostStage && deal.lostReason && (
                      <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 px-2.5 py-2 text-xs dark:bg-red-900/20">
                        <ListTodo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        <div>
                          <span className="font-medium text-red-700 dark:text-red-300">
                            {t('contactDetail.lost')}: {LOST_REASON_LABELS[deal.lostReason] || deal.lostReason}
                          </span>
                          {deal.lostReasonNote && (
                            <p className="mt-0.5 text-red-600/80 dark:text-red-400/80">
                              {deal.lostReasonNote}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader title={t('contactDetail.addNote')} />
            <Textarea
              placeholder={t('contactDetail.notePlaceholder')}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                disabled={!noteContent.trim()}
                loading={addNoteMutation.isPending}
                onClick={() => addNoteMutation.mutate(noteContent)}
              >
                <StickyNote className="h-4 w-4" />
                {t('contactDetail.saveNote')}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'timeline'
                    ? 'border-b-2 border-brand-500 text-brand-500'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <StickyNote className="h-4 w-4" />
                {t('contactDetail.timeline')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'history'
                    ? 'border-b-2 border-brand-500 text-brand-500'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <History className="h-4 w-4" />
                {t('common.history')}
              </button>
            </div>

            {activeTab === 'timeline' ? (
              <>
                <CardHeader title={t('contactDetail.timeline')} subtitle={t('contactDetail.timelineSubtitle')} />
                <div className="relative">
                  {timeline.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">{t('contactDetail.noTimelineEntries')}</p>
                  ) : (
                    <div className="space-y-0">
                      {timeline.map((item, idx) => (
                        <div key={`${item.itemType}-${item.id}`} className="relative flex gap-4 pb-8">
                          {idx < timeline.length - 1 && (
                            <div className="absolute left-4 top-8 h-full w-px bg-slate-200 dark:bg-slate-700" />
                          )}
                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            {item.itemType === 'note' ? (
                              <StickyNote className="h-4 w-4 text-amber-500" />
                            ) : (
                              <PhoneCall className="h-4 w-4 text-teal-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                                {item.itemType === 'note' ? t('contactDetail.note') : t(`activityType.${item.type}`, { defaultValue: item.type })}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                              {item.content}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {t('contactDetail.by')} {item.author?.name || item.user?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EntityHistory entityType="contact" entityId={id} />
            )}
          </Card>
        </div>
      </div>

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={(data) => addTaskMutation.mutate(data)}
        loading={addTaskMutation.isPending}
      />
    </div>
  );
}
