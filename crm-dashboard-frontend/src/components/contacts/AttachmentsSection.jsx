import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import { attachmentsApi } from '../../api';
import Button from '../common/Button';
import { formatDate, cn } from '../../utils/helpers';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsSection({ contactId, dealId, title = 'Attachments' }) {
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const params = contactId ? { contactId } : { dealId };

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', params],
    queryFn: () => attachmentsApi.getAll(params),
    enabled: !!(contactId || dealId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      if (contactId) formData.append('contactId', contactId);
      if (dealId) formData.append('dealId', dealId);
      return attachmentsApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: attachmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
    },
  });

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert('File type not allowed. Use PDF, DOCX, PNG, or JPG.');
        return;
      }
      if (file.size > MAX_SIZE) {
        alert('File exceeds 10MB limit.');
        return;
      }
      uploadMutation.mutate(file);
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div
        className={cn(
          'mb-3 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700',
          'hover:border-brand-300 hover:bg-brand-50/30 dark:hover:border-brand-700'
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        Drag & drop files here (PDF, DOCX, PNG, JPG — max 10MB)
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-500">No attachments yet</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {file.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.fileSize)} · {file.uploader?.name} ·{' '}
                  {formatDate(file.uploadedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  const res = await fetch(attachmentsApi.downloadUrl(file.id), {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded p-1.5 text-slate-400 hover:text-brand-500"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${file.filename}?`)) deleteMutation.mutate(file.id);
                }}
                className="rounded p-1.5 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
