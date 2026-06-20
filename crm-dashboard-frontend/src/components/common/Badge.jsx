import { cn } from '../../utils/helpers';

export default function Badge({ children, className, colorClass }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}
