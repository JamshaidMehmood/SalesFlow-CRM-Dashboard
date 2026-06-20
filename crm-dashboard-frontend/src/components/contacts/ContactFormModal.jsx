import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { contactsApi, leadSourcesApi, territoriesApi } from '../../api';
import Modal from '../common/Modal';
import Input, { Select } from '../common/Input';
import Button from '../common/Button';
import TagSelect from './TagSelect';
import CustomFieldsForm from './CustomFieldsForm';

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  status: 'lead',
  leadSourceId: '',
  territoryId: '',
};

export default function ContactFormModal({ open, onClose, contact, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!contact;
  const [tags, setTags] = useState([]);
  const [customFields, setCustomFields] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: contact || defaultValues,
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: leadSourcesApi.getAll,
  });

  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: territoriesApi.getAll,
  });

  useEffect(() => {
    if (open) {
      reset(
        contact
          ? {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone || '',
              company: contact.company || '',
              jobTitle: contact.jobTitle || '',
              status: contact.status,
              leadSourceId: contact.leadSourceId || contact.leadSource?.id || '',
              territoryId: contact.territoryId || contact.territory?.id || '',
            }
          : defaultValues
      );
      setTags(contact?.tags || []);
      setCustomFields(contact?.customFields || {});
      setDuplicateWarning(null);
    }
  }, [open, contact, reset]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? contactsApi.update(contact.id, data) : contactsApi.create(data),
    onSuccess: (result) => {
      if (result.duplicateWarning) {
        setDuplicateWarning(result.duplicateWarning);
      }
      onSuccess?.(result.contact || result);
      if (!result.duplicateWarning) {
        reset(defaultValues);
        onClose();
      }
    },
  });

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      tagIds: tags.map((tag) => tag.id),
      customFields,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('contacts.editContact') : t('contacts.addContact')}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('contacts.firstName')}
            {...register('firstName', { required: t('common.required') })}
            error={errors.firstName?.message}
          />
          <Input
            label={t('contacts.lastName')}
            {...register('lastName', { required: t('common.required') })}
            error={errors.lastName?.message}
          />
        </div>
        <Input
          label={t('common.email')}
          type="email"
          {...register('email', { required: t('common.required') })}
          error={errors.email?.message}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('common.phone')} {...register('phone')} />
          <Input label={t('common.company')} {...register('company')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('contacts.jobTitle')} {...register('jobTitle')} />
          <Select label={t('common.status')} {...register('status')}>
            <option value="lead">{t('status.lead')}</option>
            <option value="prospect">{t('status.prospect')}</option>
            <option value="customer">{t('status.customer')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </Select>
        </div>
        <Select
          label={`${t('contacts.leadSource')} *`}
          {...register('leadSourceId', { required: t('contacts.leadSourceRequired') })}
          error={errors.leadSourceId?.message}
        >
          <option value="">{t('contacts.selectLeadSource')}</option>
          {leadSources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select label={t('contacts.territory')} {...register('territoryId')}>
          <option value="">{t('contacts.noTerritory')}</option>
          {territories.map((territory) => (
            <option key={territory.id} value={territory.id}>
              {territory.name}
            </option>
          ))}
        </Select>

        <TagSelect value={tags} onChange={setTags} />
        <CustomFieldsForm values={customFields} onChange={setCustomFields} />

        {duplicateWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="font-medium">{duplicateWarning.message}</p>
            <ul className="mt-2 space-y-1">
              {duplicateWarning.duplicates.map((dup) => (
                <li key={dup.id}>
                  <Link to={`/contacts/${dup.id}`} className="text-brand-500 hover:underline">
                    {dup.firstName} {dup.lastName}
                  </Link>
                  {' · '}
                  {dup.email}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => {
                setDuplicateWarning(null);
                onClose();
              }}
            >
              {t('contacts.continueAnyway')}
            </Button>
          </div>
        )}

        {mutation.error && (
          <p className="text-sm text-red-500">
            {mutation.error.response?.data?.error || t('common.somethingWrong')}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t('settings.saveChanges') : t('contacts.addContact')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
