import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Lock,
  Palette,
  Bell,
  Sun,
  Moon,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Kanban,
  Target,
  ChevronRight,
  Tags,
  ListTree,
  GitMerge,
  ScrollText,
  Users,
  MapPin,
  ShieldOff,
  UserPlus,
} from 'lucide-react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Input, { Select } from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import TwoFactorSetup from '../../components/settings/TwoFactorSetup';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { cn, getInitials, formatDate } from '../../utils/helpers';

function SettingsAlert({ message, type = 'success' }) {
  if (!message) return null;
  const isSuccess = type === 'success' || message.includes('success');

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-3 text-sm',
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, colorClass, onIconClick, jumpAriaLabel }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <button
        type="button"
        onClick={onIconClick}
        className={cn(
          'rounded-xl p-3 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
          colorClass
        )}
        aria-label={jumpAriaLabel}
      >
        <Icon className="h-5 w-5" />
      </button>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'profile', labelKey: 'settings.profile', icon: User },
  { id: 'security', labelKey: 'settings.security', icon: Lock },
  { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
  { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateUser, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { isDark, toggleTheme } = useTheme();
  const [profileMsg, setProfileMsg] = useState('');
  const [profileMsgType, setProfileMsgType] = useState('success');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordMsgType, setPasswordMsgType] = useState('success');
  const [activeSection, setActiveSection] = useState('profile');
  const sectionRefs = useRef({});

  const scrollToSection = useCallback((id) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    setActiveSection(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const observers = NAV_SECTIONS.map(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );

      observer.observe(el);
      return observer;
    });

    return () => observers.forEach((obs) => obs?.disconnect());
  }, []);

  const profileForm = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, email: user.email });
    }
  }, [user, profileForm]);

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      setProfileMsgType('success');
      setProfileMsg(t('settings.profileUpdated'));
      setTimeout(() => setProfileMsg(''), 4000);
    },
    onError: (err) => {
      setProfileMsgType('error');
      setProfileMsg(err.response?.data?.error || t('settings.profileFailed'));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      passwordForm.reset();
      setPasswordMsgType('success');
      setPasswordMsg(t('settings.passwordUpdated'));
      setTimeout(() => setPasswordMsg(''), 4000);
    },
    onError: (err) => {
      setPasswordMsgType('error');
      setPasswordMsg(err.response?.data?.error || t('settings.passwordFailed'));
    },
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['auth-users'],
    queryFn: authApi.getUsers,
    enabled: isAdmin,
  });

  const disable2FAMutation = useMutation({
    mutationFn: authApi.disableUser2FA,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-users'] }),
  });

  const inviteForm = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'sales_rep' },
  });
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteMsgType, setInviteMsgType] = useState('success');

  const inviteMutation = useMutation({
    mutationFn: authApi.inviteUser,
    onSuccess: () => {
      inviteForm.reset({ name: '', email: '', password: '', role: 'sales_rep' });
      setInviteMsgType('success');
      setInviteMsg(t('settings.userInvited'));
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      setTimeout(() => setInviteMsg(''), 4000);
    },
    onError: (err) => {
      setInviteMsgType('error');
      setInviteMsg(err.response?.data?.error || t('settings.inviteFailed'));
    },
  });

  const onProfileSubmit = (data) => {
    setProfileMsg('');
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    setPasswordMsg('');
    if (data.newPassword !== data.confirmPassword) {
      setPasswordMsgType('error');
      setPasswordMsg(t('settings.passwordsNoMatch'));
      return;
    }
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const roleLabel = user?.role === 'admin' ? t('common.admin') : t('common.salesRep');

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Profile sidebar */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="overflow-hidden !p-0">
            <div className="h-24 bg-gradient-to-br from-brand-500 via-brand-600 to-teal-600" />
            <div className="relative px-6 pb-6">
              <div className="-mt-10 mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-500 text-2xl font-bold text-white shadow-lg dark:border-slate-900">
                {getInitials(user?.name)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
              <Badge
                colorClass="mt-3 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                className="capitalize"
              >
                <Shield className="mr-1 inline h-3 w-3" />
                {roleLabel}
              </Badge>
              {user?.createdAt && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('settings.memberSince')} {formatDate(user.createdAt)}
                </p>
              )}
            </div>
          </Card>

          <nav className="mt-4 hidden space-y-1 lg:block" aria-label="Settings sections">
            {NAV_SECTIONS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeSection === id
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-400'
                )}
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings sections */}
        <div className="space-y-6">
          {/* Profile */}
          <Card
            id="profile"
            tabIndex={-1}
            ref={(el) => { sectionRefs.current.profile = el; }}
            className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <SectionHeader
              icon={User}
              title={t('settings.profile')}
              subtitle={t('settings.profileSubtitle')}
              colorClass="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              onIconClick={() => scrollToSection('profile')}
              jumpAriaLabel={t('settings.jumpToSection', { section: t('settings.profile') })}
            />
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('settings.fullName')} {...profileForm.register('name', { required: true })} />
                <Input
                  label={t('settings.emailAddress')}
                  type="email"
                  {...profileForm.register('email', { required: true })}
                />
              </div>
              <SettingsAlert message={profileMsg} type={profileMsgType} />
              <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
                <Button type="submit" loading={profileMutation.isPending}>
                  {t('settings.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>

          {/* Security */}
          <Card
            id="security"
            tabIndex={-1}
            ref={(el) => { sectionRefs.current.security = el; }}
            className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <SectionHeader
              icon={Lock}
              title={t('settings.security')}
              subtitle={t('settings.securitySubtitle')}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
              onIconClick={() => scrollToSection('security')}
              jumpAriaLabel={t('settings.jumpToSection', { section: t('settings.security') })}
            />
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <Input
                label={t('settings.currentPassword')}
                type="password"
                placeholder={t('settings.currentPasswordPlaceholder')}
                {...passwordForm.register('currentPassword', { required: true })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('settings.newPassword')}
                  type="password"
                  placeholder={t('settings.newPasswordPlaceholder')}
                  {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
                />
                <Input
                  label={t('settings.confirmNewPassword')}
                  type="password"
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  {...passwordForm.register('confirmPassword', { required: true })}
                />
              </div>
              <SettingsAlert message={passwordMsg} type={passwordMsgType} />
              <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
                <Button type="submit" loading={passwordMutation.isPending}>
                  {t('settings.updatePassword')}
                </Button>
              </div>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800">
              <TwoFactorSetup />
            </div>

            {isAdmin && adminUsers.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800">
                <h4 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {t('settings.userSecurityAdmin')}
                </h4>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {adminUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {u.twoFactorEnabled ? (
                          <>
                            <Badge colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {t('settings.twoFactorOn')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={disable2FAMutation.isPending}
                              onClick={() => {
                                if (confirm(t('settings.disable2faConfirm', { name: u.name }))) {
                                  disable2FAMutation.mutate(u.id);
                                }
                              }}
                            >
                              <ShieldOff className="h-3.5 w-3.5" />
                              {t('settings.disable2fa')}
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">{t('settings.twoFactorOff')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Appearance */}
          <Card
            id="appearance"
            tabIndex={-1}
            ref={(el) => { sectionRefs.current.appearance = el; }}
            className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <SectionHeader
              icon={Palette}
              title={t('settings.appearance')}
              subtitle={t('settings.appearanceSubtitle')}
              colorClass="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
              onIconClick={() => scrollToSection('appearance')}
              jumpAriaLabel={t('settings.jumpToSection', { section: t('settings.appearance') })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
                  !isDark
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                )}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-50">
                  <div className="w-full space-y-1.5 px-3">
                    <div className="h-2 w-1/2 rounded bg-slate-200" />
                    <div className="h-2 w-full rounded bg-slate-100" />
                    <div className="h-2 w-3/4 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{t('settings.light')}</span>
                  {!isDark && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-brand-500" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
                  isDark
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                )}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-900">
                  <div className="w-full space-y-1.5 px-3">
                    <div className="h-2 w-1/2 rounded bg-slate-600" />
                    <div className="h-2 w-full rounded bg-slate-700" />
                    <div className="h-2 w-3/4 rounded bg-slate-700" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span className="font-medium text-slate-900 dark:text-white">{t('settings.dark')}</span>
                  {isDark && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-brand-500" />
                  )}
                </div>
              </button>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
              <LanguageSwitcher />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {t('settings.themeNote')}
            </p>
          </Card>

          {/* Notifications */}
          <Card
            id="notifications"
            tabIndex={-1}
            ref={(el) => { sectionRefs.current.notifications = el; }}
            className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <SectionHeader
              icon={Bell}
              title={t('settings.notifications')}
              subtitle={t('settings.notificationsSubtitle')}
              colorClass="bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
              onIconClick={() => scrollToSection('notifications')}
              jumpAriaLabel={t('settings.jumpToSection', { section: t('settings.notifications') })}
            />
            <div className="space-y-4">
              {[
                { labelKey: 'settings.notifDealStage', descKey: 'settings.notifDealStageDesc' },
                { labelKey: 'settings.notifActivity', descKey: 'settings.notifActivityDesc' },
                { labelKey: 'settings.notifWeekly', descKey: 'settings.notifWeeklyDesc' },
              ].map((item) => (
                <div
                  key={item.labelKey}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {t(item.labelKey)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t(item.descKey)}</p>
                  </div>
                  <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm dark:bg-slate-400" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              {t('settings.notifPreview')}
            </p>
          </Card>

          {user?.role === 'admin' && (
            <Card
              id="invite"
              tabIndex={-1}
              className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <SectionHeader
                icon={UserPlus}
                title={t('settings.inviteTeammate')}
                subtitle={t('settings.inviteTeammateSubtitle')}
                colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
              />
              <form
                onSubmit={inviteForm.handleSubmit((data) => {
                  setInviteMsg('');
                  inviteMutation.mutate(data);
                })}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('settings.fullName')}
                    {...inviteForm.register('name', { required: true })}
                  />
                  <Input
                    label={t('common.email')}
                    type="email"
                    {...inviteForm.register('email', { required: true })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('settings.tempPassword')}
                    type="password"
                    {...inviteForm.register('password', { required: true, minLength: 6 })}
                  />
                  <Select label={t('settings.role')} {...inviteForm.register('role')}>
                    <option value="sales_rep">{t('common.salesRep')}</option>
                    <option value="admin">{t('common.admin')}</option>
                  </Select>
                </div>
                <SettingsAlert message={inviteMsg} type={inviteMsgType} />
                <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
                  <Button type="submit" loading={inviteMutation.isPending}>
                    {t('settings.sendInvite')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {user?.role === 'admin' && (
            <Card className="scroll-mt-24">
              <SectionHeader
                icon={Shield}
                title={t('settings.adminSettings')}
                subtitle={t('settings.adminSettingsSubtitle')}
                colorClass="bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
              />
              <div className="space-y-2">
                {[
                  { to: '/settings/pipeline', icon: Kanban, iconClass: 'bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300', titleKey: 'settings.pipelineSettings', descKey: 'settings.pipelineSettingsDesc' },
                  { to: '/settings/quotas', icon: Target, iconClass: 'bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', titleKey: 'settings.salesQuotas', descKey: 'settings.salesQuotasDesc' },
                  { to: '/settings/custom-fields', icon: ListTree, iconClass: 'bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300', titleKey: 'settings.customFields', descKey: 'settings.customFieldsDesc' },
                  { to: '/settings/lead-sources', icon: Tags, iconClass: 'bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300', titleKey: 'settings.leadSources', descKey: 'settings.leadSourcesDesc' },
                  { to: '/settings/teams', icon: Users, iconClass: 'bg-cyan-100 p-2 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300', titleKey: 'settings.teams', descKey: 'settings.teamsDesc' },
                  { to: '/settings/territories', icon: MapPin, iconClass: 'bg-teal-100 p-2 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300', titleKey: 'settings.territories', descKey: 'settings.territoriesDesc' },
                  { to: '/settings/audit-log', icon: ScrollText, iconClass: 'bg-slate-200 p-2 text-slate-600 dark:bg-slate-700 dark:text-slate-300', titleKey: 'settings.auditLog', descKey: 'settings.auditLogDesc' },
                ].map(({ to, icon: Icon, iconClass, titleKey, descKey }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-brand-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg', iconClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {t(titleKey)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t(descKey)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="scroll-mt-24">
            <SectionHeader
              icon={GitMerge}
              title={t('settings.dataManagement')}
              subtitle={t('settings.dataManagementSubtitle')}
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
            />
            <Link
              to="/contacts/duplicates"
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-brand-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
                  <GitMerge className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t('settings.duplicateContacts')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('settings.duplicateContactsDesc')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
