import prisma from './prisma.js';

export async function loadDataScope(user) {
  if (user.role === 'admin') return { type: 'admin' };

  const managedTeam = await prisma.team.findFirst({
    where: { managerId: user.id },
    select: { id: true },
  });

  if (managedTeam) {
    return { type: 'team_manager', teamId: managedTeam.id };
  }

  return { type: 'rep', userId: user.id };
}

export function contactScopeFilter(user, scope) {
  if (user.role === 'admin') return {};
  if (scope?.type === 'team_manager') return { owner: { teamId: scope.teamId } };
  return { ownerId: user.id };
}

export function dealScopeFilter(user, scope) {
  if (user.role === 'admin') return {};
  if (scope?.type === 'team_manager') return { owner: { teamId: scope.teamId } };
  return { ownerId: user.id };
}

export function activityScopeFilter(user, scope) {
  if (user.role === 'admin') return {};
  if (scope?.type === 'team_manager') {
    return { contact: { owner: { teamId: scope.teamId } } };
  }
  return { contact: { ownerId: user.id } };
}

/** @deprecated use contactScopeFilter(user, req.dataScope) */
export function ownerFilter(user, scope) {
  return contactScopeFilter(user, scope);
}

/** @deprecated use dealScopeFilter(user, req.dataScope) */
export function dealOwnerFilter(user, scope) {
  return dealScopeFilter(user, scope);
}

/** @deprecated use activityScopeFilter(user, req.dataScope) */
export function activityOwnerFilter(user, scope) {
  return activityScopeFilter(user, scope);
}

export function isTeamManager(scope) {
  return scope?.type === 'team_manager';
}
