import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../../api';
import TagPill from './TagPill';

export default function TagSelect({ value = [], onChange }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onChange([...value, tag]);
      setInput('');
    },
  });

  const selectedIds = new Set(value.map((t) => t.id));
  const filtered = allTags.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      (!input || t.name.toLowerCase().includes(input.toLowerCase()))
  );

  const addTag = (tag) => {
    if (!selectedIds.has(tag.id)) onChange([...value, tag]);
    setInput('');
    setOpen(false);
  };

  const removeTag = (tagId) => onChange(value.filter((t) => t.id !== tagId));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const existing = allTags.find(
        (t) => t.name.toLowerCase() === input.trim().toLowerCase()
      );
      if (existing) addTag(existing);
      else createMutation.mutate({ name: input.trim() });
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Tags
      </label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
        {value.map((tag) => (
          <TagPill key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
        ))}
        <div className="relative min-w-[120px] flex-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
            className="w-full bg-transparent px-1 py-0.5 text-sm outline-none"
          />
          {open && (filtered.length > 0 || input.trim()) && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filtered.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {tag.name}
                </button>
              ))}
              {input.trim() &&
                !allTags.some((t) => t.name.toLowerCase() === input.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => createMutation.mutate({ name: input.trim() })}
                    className="block w-full px-3 py-2 text-left text-sm text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Create &ldquo;{input.trim()}&rdquo;
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
