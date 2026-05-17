"use client";
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import styles from './BugReportModal.module.css';

interface BugReportModalProps {
  onClose: () => void;
  username?: string;
  email?: string;
}

export function BugReportModal({ onClose, username, email }: BugReportModalProps) {
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: report, username, email }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setIsSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError('Failed to send — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className={styles.header}>
          <span className={styles.label}>// BUG REPORT</span>
          <h2 className={styles.title}>Something broken?</h2>
          <p className={styles.desc}>Let us know what&apos;s not working, and we&apos;ll fix it in the next build.</p>
        </div>

        {isSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <Send size={24} />
            </div>
            <h3>Report Sent</h3>
            <p>Thanks for helping us improve Stag&apos;d.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              className={styles.textarea}
              placeholder="Describe the issue... (e.g. The checkout button on mobile is overlapping)"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={5}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={`btn btn-accent ${styles.submitBtn}`}
              disabled={isSubmitting || !report.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Send Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
