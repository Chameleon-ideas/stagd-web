"use client";

import { useState } from 'react';
import type { CommissionDetails } from '@/lib/types';
import styles from './BriefCard.module.css';

interface BriefCardProps {
  commission: CommissionDetails;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export function BriefCard({ commission: c }: BriefCardProps) {
  const [referenceExpanded, setReferenceExpanded] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);

  // Derive fields — prefer new individual fields, fall back to parsing brief_what
  const discipline = c.brief_discipline ?? (c.brief_what?.split(':')[0] ?? '');
  const deliverable = c.brief_deliverable ?? (c.brief_what?.split(':').slice(1).join(':').split('\n\n')[0].trim() ?? '');
  const description = c.brief_description ?? (c.brief_what?.split('\n\n').slice(1).join('\n\n') ?? '');
  const deadline = c.brief_deadline;
  const duration = c.brief_duration;
  const budget = c.brief_budget_amount;
  const reference = c.brief_reference;

  const descTruncated = description.length > 180;
  const descDisplay = descTruncated && !briefExpanded
    ? description.slice(0, 180) + '…'
    : description;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>// COMMISSION BRIEF</span>
        <span className={`${styles.statusPill} ${styles[`status_${c.status}`]}`}>
          {c.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.key}>Discipline</span>
          <span className={styles.val}>{discipline || '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>Deliverable</span>
          <span className={styles.val}>{deliverable || '—'}</span>
        </div>

        {description && (
          <div className={styles.rowFull}>
            <span className={styles.key}>Brief</span>
            <p className={styles.briefText}>
              {descDisplay}
              {descTruncated && (
                <button className={styles.readMore} onClick={() => setBriefExpanded(v => !v)}>
                  {briefExpanded ? ' Read less' : ' Read more'}
                </button>
              )}
            </p>
          </div>
        )}

        {reference && (
          <div className={styles.rowFull}>
            <span className={styles.key}>Reference</span>
            <button
              className={styles.referenceThumb}
              onClick={() => setReferenceExpanded(v => !v)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reference}
                alt="Reference"
                className={`${styles.referenceImg} ${referenceExpanded ? styles.referenceImgFull : ''}`}
              />
              {!referenceExpanded && <span className={styles.referenceOverlay}>Tap to expand</span>}
            </button>
          </div>
        )}

        <div className={styles.row}>
          <span className={styles.key}>Deadline</span>
          <span className={styles.val}>{formatDate(deadline)}</span>
        </div>
        {duration && (
          <div className={styles.row}>
            <span className={styles.key}>Duration</span>
            <span className={styles.val}>{duration}</span>
          </div>
        )}
        {budget != null && (
          <div className={styles.row}>
            <span className={styles.key}>Budget</span>
            <span className={styles.val}>PKR {budget.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
