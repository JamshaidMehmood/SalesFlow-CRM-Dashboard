import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { teamsApi } from '../../api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Select } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { getInitials } from '../../utils/helpers';

export default function TeamsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [memberModalTeam, setMemberModalTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [selectedRepId, setSelectedRepId] = useState('');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  });

  const { data: reps = [] } = useQuery({
    queryKey: ['team-reps'],
    queryFn: teamsApi.getReps,
  });

  const createMutation = useMutation({
    mutationFn: teamsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teamsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.addMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-reps'] });
      setSelectedRepId('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }) => teamsApi.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-reps'] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditTeam(null);
    setName('');
    setManagerId('');
  };

  const openCreate = () => {
    setEditTeam(null);
    setName('');
    setManagerId('');
    setModalOpen(true);
  };

  const openEdit = (team) => {
    setEditTeam(team);
    setName(team.name);
    setManagerId(team.managerId || '');
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = { name, managerId: managerId || null };
    if (editTeam) {
      updateMutation.mutate({ id: editTeam.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const unassignedReps = (team) =>
    reps.filter((r) => !r.teamId && !team.members.some((m) => m.id === r.id));

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.teams')}</h1>
          <p className="mt-1 text-slate-500">{t('settings.teamsSubtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('settings.addTeam')}
        </Button>
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                {team.manager && (
                  <p className="mt-1 text-sm text-slate-500">
                    {t('settings.managerLabel', { name: team.manager.name })}
                  </p>
                )}
                <Badge colorClass="mt-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {t('settings.membersCount', { count: team.members?.length || 0 })}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setMemberModalTeam(team)}>
                  <UserPlus className="h-4 w-4" />
                  {t('settings.members')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openEdit(team)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => {
                    if (confirm(t('settings.deleteTeamConfirm', { name: team.name }))) {
                      deleteMutation.mutate(team.id);
                    }
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {team.members?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800/50"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      {getInitials(member.name)}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{member.name}</span>
                    <button
                      onClick={() =>
                        removeMemberMutation.mutate({ teamId: team.id, userId: member.id })
                      }
                      className="text-slate-400 hover:text-red-500"
                      aria-label={t('common.remove')}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}

        {teams.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-slate-500">
              {t('settings.noTeamsYet')}
            </p>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTeam ? t('settings.editTeam') : t('settings.createTeam')}
      >
        <div className="space-y-4">
          <Input label={t('settings.teamName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label={t('settings.manager')}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">{t('settings.noManager')}</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editTeam ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!memberModalTeam}
        onClose={() => {
          setMemberModalTeam(null);
          setSelectedRepId('');
        }}
        title={t('settings.manageMembers', { name: memberModalTeam?.name || '' })}
      >
        {memberModalTeam && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="flex-1"
              >
                <option value="">{t('settings.selectRepToAdd')}</option>
                {unassignedReps(memberModalTeam).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </Select>
              <Button
                disabled={!selectedRepId}
                loading={addMemberMutation.isPending}
                onClick={() =>
                  addMemberMutation.mutate({
                    teamId: memberModalTeam.id,
                    userId: selectedRepId,
                  })
                }
              >
                {t('common.add')}
              </Button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(memberModalTeam.members || []).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{m.name}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      removeMemberMutation.mutate({ teamId: memberModalTeam.id, userId: m.id })
                    }
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              ))}
              {!memberModalTeam.members?.length && (
                <p className="py-4 text-center text-sm text-slate-500">{t('settings.noMembersYet')}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
