import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Kanban, Shield, Users } from 'lucide-react';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { cn } from '../../utils/helpers';

const FEATURES = [
  { icon: Kanban, titleKey: 'auth.featurePipelineTitle', descKey: 'auth.featurePipelineDesc' },
  { icon: BarChart3, titleKey: 'auth.featureAnalyticsTitle', descKey: 'auth.featureAnalyticsDesc' },
  { icon: Users, titleKey: 'auth.featureTeamsTitle', descKey: 'auth.featureTeamsDesc' },
];

export default function AuthShell({ title, subtitle, children, footer, variant = 'default' }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher compact />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,122,89,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,122,89,0.08),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.25) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-sidebar p-12 xl:p-14 lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-500/30">
              SF
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">{t('nav.brand')}</span>
          </div>

          <h1 className="mt-12 max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
            {t('auth.marketingHeadline')}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
            {t('auth.marketingSubtitle')}
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <li key={titleKey} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{t(titleKey)}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{t(descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {variant === 'default' && (
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              <Shield className="h-3.5 w-3.5" />
              {t('auth.demoAccounts')}
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                <span className="font-medium text-white">{t('auth.demoAdmin')}</span>{' '}
                <span className="font-mono text-slate-400">admin@example.com</span>
                <span className="mx-2 text-slate-600">·</span>
                <span className="font-mono text-slate-400">password123</span>
              </p>
              <p className="text-slate-300">
                <span className="font-medium text-white">{t('auth.demoSales')}</span>{' '}
                <span className="font-mono text-slate-400">sales@example.com</span>
                <span className="mx-2 text-slate-600">·</span>
                <span className="font-mono text-slate-400">password123</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md shadow-brand-500/25">
            SF
          </div>
          <span className="text-lg font-semibold text-slate-900 dark:text-white">{t('nav.brand')}</span>
        </div>

        <div className="w-full max-w-[420px]">
          <div
            className={cn(
              'rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-sm',
              'dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none'
            )}
          >
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>

            {children}

            {footer && <div className="mt-2">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthDivider() {
  const { t } = useTranslation();

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:bg-slate-900">
          {t('auth.orContinueEmail')}
        </span>
      </div>
    </div>
  );
}

export function AuthFooterLink({ prompt, linkText, to }) {
  return (
    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
      {prompt}{' '}
      <Link
        to={to}
        className="font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
      >
        {linkText}
      </Link>
    </p>
  );
}

export function AuthError({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}
