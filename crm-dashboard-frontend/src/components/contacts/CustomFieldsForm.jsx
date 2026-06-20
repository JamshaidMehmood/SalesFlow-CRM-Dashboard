import { useQuery } from '@tanstack/react-query';
import { customFieldsApi } from '../../api';
import Input, { Select } from '../common/Input';

export default function CustomFieldsForm({ values = {}, onChange, errors = {} }) {
  const { data: fields = [] } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: customFieldsApi.getAll,
  });

  if (!fields.length) return null;

  const setValue = (id, val) => onChange({ ...values, [id]: val });

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Custom Fields</h4>
      {fields.map((field) => {
        const val = values[field.id] ?? '';
        const error = errors[field.id];

        if (field.fieldType === 'select') {
          const options = Array.isArray(field.options) ? field.options : [];
          return (
            <Select
              key={field.id}
              label={`${field.label}${field.isRequired ? ' *' : ''}`}
              value={val}
              onChange={(e) => setValue(field.id, e.target.value)}
              error={error}
            >
              <option value="">Select...</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          );
        }

        return (
          <Input
            key={field.id}
            label={`${field.label}${field.isRequired ? ' *' : ''}`}
            type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
            value={val}
            onChange={(e) => setValue(field.id, e.target.value)}
            error={error}
          />
        );
      })}
    </div>
  );
}
