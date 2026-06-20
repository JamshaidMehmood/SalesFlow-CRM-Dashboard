import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import Sidebar, { MobileHeader } from './Sidebar';
import GlobalSearch, { SearchTrigger } from '../components/search/GlobalSearch';

const PAGE_TITLE_KEYS = {
  '/': 'nav.dashboard',
  '/contacts': 'nav.contacts',
  '/pipeline': 'nav.pipeline',
  '/activities': 'nav.activities',
  '/leaderboard': 'nav.leaderboard',
  '/reports': 'nav.reports',
  '/settings': 'nav.settings',
  '/settings/pipeline': 'nav.pipelineSettings',
  '/settings/quotas': 'nav.salesQuotas',
  '/settings/custom-fields': 'nav.customFields',
  '/settings/lead-sources': 'nav.leadSources',
  '/settings/audit-log': 'nav.auditLog',
  '/settings/teams': 'nav.teams',
  '/settings/territories': 'nav.territories',
  '/contacts/duplicates': 'nav.duplicateContacts',
};

export default function AppLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTitle = () => {
    if (location.pathname.startsWith('/contacts/') && location.pathname !== '/contacts/duplicates') {
      return t('nav.contactDetail');
    }
    const base = Object.keys(PAGE_TITLE_KEYS).find(
      (path) => path === location.pathname || (path !== '/' && location.pathname.startsWith(path))
    );
    return base ? t(PAGE_TITLE_KEYS[base]) : t('nav.brand');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white px-8 py-3 lg:block dark:border-slate-800 dark:bg-slate-900">
          <SearchTrigger onClick={() => setSearchOpen(true)} />
        </div>
        <MobileHeader
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          title={getTitle()}
        />
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
