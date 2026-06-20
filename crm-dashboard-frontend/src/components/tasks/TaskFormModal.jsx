import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input, { Textarea } from '../common/Input';
import { addDays } from '../../utils/helpers';

const QUICK_PICKS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];

export default function TaskFormModal({ open, onClose, onSubmit, loading }) {
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: { title: '', dueDate: addDays(1) },
  });

  const submit = (data) => {
    onSubmit({ ...data, dueDate: new Date(data.dueDate).toISOString() });
    reset();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Task / Reminder">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Input label="Title" placeholder="Call back about proposal..." {...register('title', { required: true })} />
        <div>
          <Input label="Due Date" type="datetime-local" {...register('dueDate', { required: true })} />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_PICKS.map(({ label, days }) => (
              <button
                key={label}
                type="button"
                onClick={() => setValue('dueDate', addDays(days))}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
