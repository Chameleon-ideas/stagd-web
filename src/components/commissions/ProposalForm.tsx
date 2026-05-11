"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Proposal } from '@/lib/types';
import styles from './ProposalForm.module.css';

interface ProposalFormProps {
  existingProposal?: Proposal | null;
  nextVersion: number;
  onSubmit: (data: ProposalFormData) => Promise<void>;
  onClose: () => void;
}

export interface ProposalFormData {
  title: string;
  description?: string;
  total_price: number;
  deposit_amount?: number;
  delivery_date?: string;
  revisions?: number;
  deliverables?: string;
  version: number;
}

export function ProposalForm({ existingProposal, nextVersion, onSubmit, onClose }: ProposalFormProps) {
  const [title, setTitle] = useState(existingProposal?.title ?? '');
  const [description, setDescription] = useState(existingProposal?.description ?? '');
  const [totalPrice, setTotalPrice] = useState(existingProposal?.total_price?.toString() ?? '');
  const [depositAmount, setDepositAmount] = useState(existingProposal?.deposit_amount?.toString() ?? '');
  const [deliveryDate, setDeliveryDate] = useState(existingProposal?.delivery_date ?? '');
  const [revisions, setRevisions] = useState(existingProposal?.revisions?.toString() ?? '');
  const [deliverables, setDeliverables] = useState(existingProposal?.deliverables ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalNum = parseInt(totalPrice) || 0;
  const depositNum = depositAmount ? parseInt(depositAmount) || 0 : undefined;
  const canSubmit = title.trim().length > 0 && totalNum >= 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        total_price: totalNum,
        deposit_amount: depositNum,
        delivery_date: deliveryDate || undefined,
        revisions: revisions ? parseInt(revisions) : undefined,
        deliverables: deliverables.trim() || undefined,
        version: nextVersion,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>
            // {nextVersion > 1 ? `REVISED PROPOSAL — V${nextVersion}` : 'SEND PROPOSAL'}
          </span>
          <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.scrollArea}>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Project Title *</label>
              <input
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Brand identity shoot"
                required
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Description (Optional)</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What you'll deliver and how..."
                rows={3}
              />
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Total Price (PKR) *</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1000"
                  value={totalPrice}
                  onChange={e => setTotalPrice(e.target.value)}
                  placeholder="e.g. 150000"
                  required
                />
                {totalNum > 0 && totalNum < 1000 && (
                  <p className={styles.hint}>Minimum PKR 1,000</p>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Deposit Amount (Optional)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="e.g. 50000"
                />
                {depositNum != null && depositNum > totalNum && (
                  <p className={styles.hint}>Deposit cannot exceed total</p>
                )}
              </div>
            </div>

            {depositNum != null && depositNum > 0 && depositNum <= totalNum && (
              <div className={styles.priceBreakdown}>
                <span>Deposit: PKR {depositNum.toLocaleString()}</span>
                <span>·</span>
                <span>Balance: PKR {(totalNum - depositNum).toLocaleString()}</span>
              </div>
            )}

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Delivery Date</label>
                <input
                  className={styles.input}
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Revisions Included</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  value={revisions}
                  onChange={e => setRevisions(e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Deliverables (Optional)</label>
              <textarea
                className={styles.textarea}
                value={deliverables}
                onChange={e => setDeliverables(e.target.value)}
                placeholder="What the client will receive — file formats, quantities, etc."
                rows={3}
              />
            </div>

            {error && <p className={styles.error}>⚠ {error}</p>}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSend}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Sending...' : nextVersion > 1 ? 'Send Revised Proposal' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
