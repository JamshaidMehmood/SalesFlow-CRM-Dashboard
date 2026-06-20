import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Pencil } from 'lucide-react';
import { pipelineStagesApi } from '../../api';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { getStageColor } from '../../utils/helpers';
import Badge from '../../components/common/Badge';

function SortableStage({ stage, index, onEdit, onDelete, onProbabilityChange, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isClosedStage = stage.isWonStage || stage.isLostStage;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
        <GripVertical className="h-5 w-5" />
      </button>
      <Badge colorClass={getStageColor(stage, index)}>{stage.name}</Badge>
      <span className="text-sm text-slate-500">{t('settings.dealsCount', { count: stage._count?.deals || 0 })}</span>
      {stage.isWonStage && <span className="text-xs text-emerald-600">{t('settings.wonStage')}</span>}
      {stage.isLostStage && <span className="text-xs text-red-600">{t('settings.lostStage')}</span>}
      <div className="ml-auto flex items-center gap-2">
        {!isClosedStage && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">{t('settings.winPercent')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={stage.winProbability ?? 0}
              onChange={(e) => onProbabilityChange(stage.id, Number(e.target.value))}
              className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}
        {isClosedStage && (
          <span className="text-xs text-slate-500">{stage.winProbability}%</span>
        )}
        <button onClick={() => onEdit(stage)} className="rounded p-1.5 text-slate-400 hover:text-brand-500">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(stage)} className="rounded p-1.5 text-slate-400 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function PipelineSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editStage, setEditStage] = useState(null);
  const [name, setName] = useState('');
  const [winProbability, setWinProbability] = useState(10);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: pipelineStagesApi.getAll,
  });

  const reorderMutation = useMutation({
    mutationFn: pipelineStagesApi.reorder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editStage ? pipelineStagesApi.update(editStage.id, data) : pipelineStagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      setModalOpen(false);
      setEditStage(null);
      setName('');
      setWinProbability(10);
    },
  });

  const probabilityMutation = useMutation({
    mutationFn: ({ id, winProbability: prob }) =>
      pipelineStagesApi.update(id, { winProbability: prob }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (stage) => {
      if (stage._count?.deals > 0) {
        const others = stages.filter((s) => s.id !== stage.id);
        const target = others.find((s) => !s.isLostStage) || others[0];
        if (!target) throw new Error('No stage to reassign deals to');
        return pipelineStagesApi.delete(stage.id, { reassignToStageId: target.id });
      }
      return pipelineStagesApi.delete(stage.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(stages, oldIndex, newIndex);
    reorderMutation.mutate(reordered.map((s) => s.id));
  };

  const handleProbabilityChange = (id, value) => {
    if (Number.isNaN(value)) return;
    probabilityMutation.mutate({ id, winProbability: Math.min(100, Math.max(0, value)) });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.pipelineSettings')}</h1>
          <p className="mt-1 text-slate-500">{t('settings.customizeStagesSubtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setEditStage(null);
            setName('');
            setWinProbability(10);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('settings.addStage')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <CardHeader
            title={t('settings.pipelineStagesTitle')}
            subtitle={t('settings.pipelineStagesSubtitle')}
          />
        </div>
        <div className="space-y-2 p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {stages.map((stage, index) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  index={index}
                  t={t}
                  onEdit={(s) => {
                    setEditStage(s);
                    setName(s.name);
                    setWinProbability(s.winProbability ?? 10);
                    setModalOpen(true);
                  }}
                  onDelete={(s) => {
                    if (confirm(t('settings.deleteStageConfirm', { name: s.name }))) deleteMutation.mutate(s);
                  }}
                  onProbabilityChange={handleProbabilityChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editStage ? t('settings.editStage') : t('settings.addStage')}
      >
        <div className="space-y-4">
          <Input label={t('settings.stageName')} value={name} onChange={(e) => setName(e.target.value)} />
          {editStage && !editStage.isWonStage && !editStage.isLostStage && (
            <Input
              label={t('settings.winProbability')}
              type="number"
              min="0"
              max="100"
              value={winProbability}
              onChange={(e) => setWinProbability(Number(e.target.value))}
            />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() =>
                saveMutation.mutate({
                  name,
                  ...(editStage &&
                    !editStage.isWonStage &&
                    !editStage.isLostStage && { winProbability }),
                  ...(!editStage && { winProbability }),
                })
              }
              loading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
