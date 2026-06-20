import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '../../utils/helpers';

const LANGUAGES = [
  { code: 'en', labelKey: 'common.english' },
  { code: 'de', labelKey: 'common.german' },
];

export default function LanguageSwitcher({ compact = false, className }) {
  const { i18n, t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Languages className="h-3.5 w-3.5" />
          {t('common.language')}
        </span>
      )}
      <div
        className={cn(
          'inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700',
          compact && 'w-full'
        )}
        role="group"
        aria-label={t('common.language')}
      >
        {LANGUAGES.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors',
              compact && 'flex-1',
              i18n.language?.startsWith(code)
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
