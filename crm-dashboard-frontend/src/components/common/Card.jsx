import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Card = forwardRef(function Card(
  { children, className, padding = true, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
});

export default Card;

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
