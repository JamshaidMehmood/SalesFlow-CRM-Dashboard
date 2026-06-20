import { Check } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function ChartLegendToggles({ items, onToggle }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map(({ key, label, color, checked }) => (
        <label
          key={key}
          className={cn(
            'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors',
            checked
              ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              : 'border-slate-100 bg-slate-50/80 opacity-75 dark:border-slate-800 dark:bg-slate-800/40'
          )}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="truncate">{label}</span>
          </span>
          <span
            className={cn(
              'ml-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
              checked
                ? 'border-slate-900 bg-slate-900 dark:border-slate-200 dark:bg-slate-200'
                : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
            )}
          >
            {checked && (
              <Check className="h-3 w-3 text-white dark:text-slate-900" strokeWidth={3} />
            )}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={() => onToggle(key)}
          />
        </label>
      ))}
    </div>
  );
}
