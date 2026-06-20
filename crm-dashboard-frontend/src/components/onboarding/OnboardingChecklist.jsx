import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  X,
  UserPlus,
  Briefcase,
  Phone,
  User,
  Users,
  Sparkles,
} from 'lucide-react';
import { onboardingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader } from '../common/Card';
import Button from '../common/Button';
import { cn } from '../../utils/helpers';

const STEP_CONFIG = {
  first_contact: {
    labelKey: 'onboarding.firstContact',
    descKey: 'onboarding.firstContactDesc',
    icon: UserPlus,
    to: '/contacts',
  },
  first_deal: {
    labelKey: 'onboarding.firstDeal',
    descKey: 'onboarding.firstDealDesc',
    icon: Briefcase,
    to: '/pipeline',
  },
  first_activity: {
    labelKey: 'onboarding.firstActivity',
    descKey: 'onboarding.firstActivityDesc',
    icon: Phone,
    to: '/activities',
  },
  profile_setup: {
    labelKey: 'onboarding.profileSetup',
    descKey: 'onboarding.profileSetupDesc',
    icon: User,
    to: '/settings#profile',
  },
  invite_teammate: {
    labelKey: 'onboarding.inviteTeammate',
    descKey: 'onboarding.inviteTeammateDesc',
    icon: Users,
    to: '/settings#invite',
  },
};

function ConfettiOverlay({ show }) {
  if (!show) return null;

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${((i * 17 + 13) % 100)}%`,
    delay: `${((i * 7) % 50) / 100}s`,
    color: ['#ff7a59', '#10b981', '#6366f1', '#f59e0b', '#ec4899'][i % 5],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 h-2 w-2 animate-confetti rounded-full opacity-80"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingChecklist() {
  const { t } = useTranslation();
  const { onboarding, setOnboarding, user } = useAuth();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const [wasComplete, setWasComplete] = useState(false);

  const { data: fetched } = useQuery({
    queryKey: ['onboarding'],
    queryFn: onboardingApi.get,
    initialData: onboarding,
    enabled: !!user && !onboarding?.dismissed,
  });

  const dismissMutation = useMutation({
    mutationFn: onboardingApi.dismiss,
    onSuccess: () => {
      const dismissed = { ...(onboarding || fetched || {}), dismissed: true };
      setOnboarding(dismissed);
      queryClient.setQueryData(['onboarding'], dismissed);
    },
  });

  const status = fetched || onboarding;

  useEffect(() => {
    if (status?.isComplete && !wasComplete) {
      setShowConfetti(true);
      setWasComplete(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [status?.isComplete, wasComplete]);

  if (!status || status.dismissed) return null;

  const progress = status.total > 0 ? Math.round((status.completedCount / status.total) * 100) : 0;

  return (
    <Card className="relative overflow-hidden">
      <ConfettiOverlay show={showConfetti} />
      <CardHeader
        title={t('onboarding.title')}
        subtitle={t('onboarding.progress', {
          completed: status.completedCount,
          total: status.total,
        })}
        action={
          <button
            type="button"
            onClick={() => dismissMutation.mutate()}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label={t('onboarding.dismissAria')}
          >
            <X className="h-4 w-4" />
          </button>
        }
      />

      {status.isComplete && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:from-emerald-900/20 dark:to-teal-900/20">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t('onboarding.allSet')}
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {t('onboarding.allSetDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {status.steps.map((step) => {
          const config = STEP_CONFIG[step];
          if (!config) return null;
          const done = status.completed.includes(step);
          const Icon = config.icon;

          return (
            <li key={step}>
              <Link
                to={config.to}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                  done
                    ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10'
                    : 'border-slate-100 bg-slate-50/50 hover:border-brand-200 hover:bg-brand-50/30 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-brand-500/30'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p
                      className={cn(
                        'text-sm font-medium',
                        done
                          ? 'text-emerald-700 line-through dark:text-emerald-300'
                          : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {t(config.labelKey)}
                    </p>
                  </div>
                  {!done && (
                    <p className="mt-0.5 text-xs text-slate-500">{t(config.descKey)}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {status.isComplete && (
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => dismissMutation.mutate()}
            loading={dismissMutation.isPending}
          >
            {t('onboarding.dismiss')}
          </Button>
        </div>
      )}
    </Card>
  );
}
