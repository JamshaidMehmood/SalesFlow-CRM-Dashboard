import prisma from '../utils/prisma.js';
import { getOnboardingStatus } from '../utils/onboarding.js';

export async function getOnboarding(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        role: true,
        onboardingCompletedSteps: true,
        onboardingDismissed: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(await getOnboardingStatus(user));
  } catch (err) {
    console.error('Get onboarding error:', err);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
}

export async function dismissOnboarding(req, res) {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { onboardingDismissed: true },
    });

    res.json({ message: 'Onboarding checklist dismissed' });
  } catch (err) {
    console.error('Dismiss onboarding error:', err);
    res.status(500).json({ error: 'Failed to dismiss onboarding' });
  }
}
