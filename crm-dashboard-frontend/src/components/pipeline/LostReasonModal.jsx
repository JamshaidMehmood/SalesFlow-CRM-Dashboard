import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Select, Textarea } from '../common/Input';
import { LOST_REASONS, LOST_REASON_LABELS } from '../../utils/helpers';

export default function LostReasonModal({ open, deal, onConfirm, onCancel, loading }) {
  const [lostReason, setLostReason] = useState('');
  const [lostReasonNote, setLostReasonNote] = useState('');

  const handleConfirm = () => {
    if (!lostReason) return;
    onConfirm({ lostReason, lostReasonNote: lostReasonNote || undefined });
  };

  const handleClose = () => {
    setLostReason('');
    setLostReasonNote('');
    onCancel();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Why was this deal lost?" size="md">
      <p className="mb-4 text-sm text-slate-500">
        {deal?.title ? `"${deal.title}"` : 'This deal'} is moving to Lost. Please select a reason.
      </p>
      <div className="space-y-4">
        <Select
          label="Lost Reason"
          value={lostReason}
          onChange={(e) => setLostReason(e.target.value)}
        >
          <option value="">Select a reason...</option>
          {LOST_REASONS.map((r) => (
            <option key={r} value={r}>
              {LOST_REASON_LABELS[r]}
            </option>
          ))}
        </Select>
        {lostReason === 'other' && (
          <Textarea
            label="Additional details"
            value={lostReasonNote}
            onChange={(e) => setLostReasonNote(e.target.value)}
            placeholder="Describe why the deal was lost..."
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!lostReason}>
            Confirm Lost
          </Button>
        </div>
      </div>
    </Modal>
  );
}
