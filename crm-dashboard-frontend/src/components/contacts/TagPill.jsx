import Badge from '../common/Badge';

export default function TagPill({ tag, onRemove, className = '' }) {
  const style = tag.color
    ? { backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}44` }
    : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={style}
    >
      {tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70">
          ×
        </button>
      )}
    </span>
  );
}
