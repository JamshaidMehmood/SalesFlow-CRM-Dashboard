import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { dealsApi, pipelineStagesApi, territoriesApi } from '../../api';
import Badge from '../common/Badge';
import { Select } from '../common/Input';
import { PageLoader } from '../common/LoadingSpinner';
import LostReasonModal from './LostReasonModal';
import DealDetailModal from './DealDetailModal';
import { formatCurrency, contactName, getStageColor } from '../../utils/helpers';

function DealCard({ deal, isDragging, onViewHistory, t }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-brand-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-slate-900 dark:text-white">{deal.title}</p>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onViewHistory(deal);
          }}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-700"
          aria-label={t('pipeline.viewDealHistory')}
        >
          <History className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{deal.contact ? contactName(deal.contact) : t('pipeline.unknown')}</p>
      <p className="mt-2 text-sm font-semibold text-brand-500">{formatCurrency(deal.value)}</p>
    </div>
  );
}

function SortableDealCard({ deal, onViewHistory, t }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { deal, stageId: deal.stageId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab active:cursor-grabbing"
    >
      <DealCard deal={deal} isDragging={isDragging} onViewHistory={onViewHistory} t={t} />
    </div>
  );
}

function StageColumn({ stage, deals, index, onViewHistory, t }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge colorClass={getStageColor(stage, index)}>{stage.name}</Badge>
          <span className="text-sm text-slate-500">{deals.length}</span>
        </div>
        <span className="text-xs text-slate-400">
          {formatCurrency(deals.reduce((s, d) => s + d.value, 0))}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] flex-1 rounded-xl border-2 border-dashed p-3 transition-colors ${
          isOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
            : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50'
        }`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} onViewHistory={onViewHistory} t={t} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeDeal, setActiveDeal] = useState(null);
  const [pendingLost, setPendingLost] = useState(null);
  const [viewDeal, setViewDeal] = useState(null);
  const [territoryId, setTerritoryId] = useState('');

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: pipelineStagesApi.getAll,
  });

  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: territoriesApi.getAll,
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', territoryId],
    queryFn: () => dealsApi.getAll(territoryId ? { territoryId } : undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => dealsApi.update(id, data),
    onMutate: async ({ id, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ['deals'] });
      const previous = queryClient.getQueryData(['deals']);
      const stage = stages.find((s) => s.id === stageId);
      queryClient.setQueryData(['deals'], (old) =>
        old?.map((d) => (d.id === id ? { ...d, stageId, stage: stage || d.stage } : d))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['deals'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const dealsByStage = useMemo(() => {
    const map = {};
    stages.forEach((s) => {
      map[s.id] = deals.filter((d) => d.stageId === s.id);
    });
    return map;
  }, [deals, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const resolveStageId = (overId) => {
    if (stages.some((s) => s.id === overId)) return overId;
    const overDeal = deals.find((d) => d.id === overId);
    return overDeal?.stageId;
  };

  const handleDragEnd = (event) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const deal = deals.find((d) => d.id === active.id);
    if (!deal) return;

    const newStageId = resolveStageId(over.id);
    if (!newStageId || newStageId === deal.stageId) return;

    const targetStage = stages.find((s) => s.id === newStageId);
    if (targetStage?.isLostStage) {
      setPendingLost({ deal, previousStageId: deal.stageId, newStageId });
      return;
    }

    updateMutation.mutate({ id: deal.id, stageId: newStageId });
  };

  const confirmLost = ({ lostReason, lostReasonNote }) => {
    if (!pendingLost) return;
    updateMutation.mutate(
      {
        id: pendingLost.deal.id,
        stageId: pendingLost.newStageId,
        lostReason,
        lostReasonNote,
      },
      { onSuccess: () => setPendingLost(null) }
    );
  };

  if (stagesLoading || dealsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('pipeline.title')}</h1>
          <p className="mt-1 text-slate-500">{t('pipeline.dealsCountSubtitle', { count: deals.length })}</p>
        </div>
        <Select
          label={t('pipeline.territory')}
          value={territoryId}
          onChange={(e) => setTerritoryId(e.target.value)}
          className="sm:w-48"
        >
          <option value="">{t('pipeline.allTerritories')}</option>
          {territories.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveDeal(deals.find((d) => d.id === e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {stages.map((stage, index) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              index={index}
              deals={dealsByStage[stage.id] || []}
              onViewHistory={setViewDeal}
              t={t}
            />
          ))}
        </div>
        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} isDragging t={t} /> : null}</DragOverlay>
      </DndContext>

      <LostReasonModal
        open={!!pendingLost}
        deal={pendingLost?.deal}
        loading={updateMutation.isPending}
        onConfirm={confirmLost}
        onCancel={() => setPendingLost(null)}
      />

      <DealDetailModal
        deal={viewDeal}
        open={!!viewDeal}
        onClose={() => setViewDeal(null)}
      />
    </div>
  );
}
