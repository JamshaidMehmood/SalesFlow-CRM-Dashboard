import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  Settings,
  Trophy,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { cn, getInitials } from '../utils/helpers';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/contacts', icon: Users, labelKey: 'nav.contacts' },
  { to: '/pipeline', icon: Kanban, labelKey: 'nav.pipeline' },
  { to: '/activities', icon: Activity, labelKey: 'nav.activities' },
  { to: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
  { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel =
    user?.role === 'admin' ? t('common.admin') : t('common.salesRep');

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-active px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
          SF
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold text-white">{t('nav.brand')}</p>
            <p className="text-xs text-slate-400">{t('nav.tagline')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-active p-3">
        {!collapsed && (
          <div className="mb-2 px-1">
            <LanguageSwitcher compact className="w-full [&_button]:flex-1" />
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-sidebar-hover hover:text-white"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && (isDark ? t('nav.lightMode') : t('nav.darkMode'))}
        </button>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs capitalize text-slate-400">{roleLabel}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-sidebar-hover hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && t('nav.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-sidebar transition-all duration-300',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar">
            <button
              onClick={onMobileClose}
              className="absolute right-3 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileHeader({ onMenuClick, onSearchClick, title }) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h1>
      {onSearchClick && (
        <button
          onClick={onSearchClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={t('nav.searchAria')}
        >
          <Search className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
