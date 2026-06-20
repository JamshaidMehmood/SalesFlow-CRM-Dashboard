import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { contactsApi } from '../../api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Select } from '../common/Input';
import { cn } from '../../utils/helpers';

const CRM_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'status', label: 'Status' },
  { key: 'leadSource', label: 'Lead Source' },
  { key: 'tags', label: 'Tags (semicolon-separated)' },
];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isCsvFile(file) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel'
  );
}

export default function ImportContactsModal({ open, onClose, onSuccess, customFields = [] }) {
  const inputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const importMutation = useMutation({
    mutationFn: contactsApi.importCsv,
    onSuccess: (data) => {
      setImportError(null);
      setResult(data);
      setStep(4);
      onSuccess?.();
    },
    onError: (err) => {
      setImportError(
        err.response?.data?.error || 'Import failed. Check your file and column mapping.'
      );
    },
  });

  const reset = () => {
    setStep(1);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setDragOver(false);
    setParseError(null);
    setImportError(null);
    setParsing(false);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file) => {
    if (!file) return;

    if (!isCsvFile(file)) {
      setParseError('Please upload a .csv file.');
      setSelectedFile(null);
      return;
    }

    setParseError(null);
    setSelectedFile(file);
    setParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta, errors }) => {
        setParsing(false);

        if (errors?.length || !meta.fields?.length) {
          setParseError('Could not read CSV headers. Check the file format.');
          setSelectedFile(null);
          return;
        }

        if (!data.length) {
          setParseError('The CSV file has no data rows.');
          setSelectedFile(null);
          return;
        }

        const cols = meta.fields;
        setHeaders(cols);
        setRows(data);
        const autoMap = {};
        CRM_FIELDS.forEach(({ key, label }) => {
          const match = cols.find(
            (c) => c.toLowerCase().replace(/\s/g, '') === label.toLowerCase().replace(/\s/g, '')
          );
          if (match) autoMap[key] = match;
        });
        customFields.forEach((field) => {
          const match = cols.find((c) => c.toLowerCase() === field.label.toLowerCase());
          if (match) autoMap[`custom_${field.id}`] = match;
        });
        setMapping(autoMap);
        setStep(2);
      },
      error: () => {
        setParsing(false);
        setParseError('Failed to parse CSV file.');
        setSelectedFile(null);
      },
    });
  };

  const handleFileInput = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setParseError(null);
    setParsing(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const allFields = [
    ...CRM_FIELDS,
    ...customFields.map((f) => ({
      key: `custom_${f.id}`,
      label: f.label,
      required: f.isRequired,
    })),
  ];

  const requiredMapped = ['firstName', 'lastName', 'email'].every((key) => mapping[key]);

  return (
    <Modal open={open} onClose={handleClose} title="Import Contacts" size="lg">
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Upload a CSV file to bulk import contacts. Required columns: first name, last name,
            and email.{' '}
            <a
              href="/sample-contacts-import.csv"
              download
              className="font-medium text-brand-500 hover:underline"
            >
              Download sample CSV
            </a>
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileInput}
          />

          {!selectedFile ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                processFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragOver
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-brand-600'
              )}
            >
              <div
                className={cn(
                  'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
                  dragOver
                    ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400'
                    : 'bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500'
                )}
              >
                <Upload className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {dragOver ? 'Drop your CSV here' : 'Drag & drop a CSV file here'}
              </p>
              <p className="mt-1 text-sm text-slate-500">or</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Browse files
              </Button>
              <p className="mt-4 text-xs text-slate-400">.csv only · UTF-8 recommended</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  {parsing && (
                    <p className="mt-2 text-xs font-medium text-brand-500">Reading file…</p>
                  )}
                </div>
                {!parsing && (
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Map CSV columns to CRM fields.</p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {allFields.map(({ key, label, required }) => (
              <div key={key} className="grid grid-cols-2 gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                  {required && ' *'}
                </span>
                <Select
                  value={mapping[key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                >
                  <option value="">— Skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          {!requiredMapped && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Map First Name, Last Name, and Email before continuing.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={!requiredMapped} onClick={() => { setImportError(null); setStep(3); }}>
              Preview
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Preview first {Math.min(5, rows.length)} of {rows.length} rows
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b dark:border-slate-800">
                  {allFields.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="px-2 py-1">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b dark:border-slate-800">
                    {allFields.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} className="px-2 py-1">
                        {row[mapping[f.key]]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              loading={importMutation.isPending}
              disabled={!selectedFile}
              onClick={() =>
                importMutation.mutate({ file: selectedFile, mapping })
              }
            >
              Import {rows.length} contacts
            </Button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            Successfully imported {result.successCount} contact(s).
          </div>
          {result.failures?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-red-600">
                {result.failureCount} row(s) failed:
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                {result.failures.map((f) => (
                  <li key={f.row}>
                    Row {f.row}: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
