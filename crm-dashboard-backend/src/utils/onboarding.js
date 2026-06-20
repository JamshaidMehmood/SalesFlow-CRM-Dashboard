import prisma from './prisma.js';

export const ONBOARDING_STEPS = {
  FIRST_CONTACT: 'first_contact',
  FIRST_DEAL: 'first_deal',
  FIRST_ACTIVITY: 'first_activity',
  PROFILE_SETUP: 'profile_setup',
  INVITE_TEAMMATE: 'invite_teammate',
};

export const ALL_STEPS = Object.values(ONBOARDING_STEPS);

export function getStepsForRole(role) {
  const steps = [
    ONBOARDING_STEPS.FIRST_CONTACT,
    ONBOARDING_STEPS.FIRST_DEAL,
    ONBOARDING_STEPS.FIRST_ACTIVITY,
    ONBOARDING_STEPS.PROFILE_SETUP,
  ];
  if (role === 'admin') steps.push(ONBOARDING_STEPS.INVITE_TEAMMATE);
  return steps;
}

export async function completeOnboardingStep(userId, step) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompletedSteps: true, role: true },
  });

  if (!user) return;

  const allowed = getStepsForRole(user.role);
  if (!allowed.includes(step)) return;

  const completed = Array.isArray(user.onboardingCompletedSteps)
    ? user.onboardingCompletedSteps
    : [];

  if (completed.includes(step)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedSteps: [...completed, step] },
  });
}

export async function getOnboardingStatus(user) {
  const steps = getStepsForRole(user.role);
  const completed = Array.isArray(user.onboardingCompletedSteps)
    ? user.onboardingCompletedSteps
    : [];

  return {
    steps,
    completed,
    dismissed: user.onboardingDismissed,
    total: steps.length,
    completedCount: steps.filter((s) => completed.includes(s)).length,
    isComplete: steps.every((s) => completed.includes(s)),
  };
}
