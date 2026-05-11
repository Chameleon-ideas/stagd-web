"use client";

import { useState } from 'react';
import type { Proposal, CommissionDetails, PaymentStatus } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ProposalCard.module.css';

interface ProposalCardProps {
  proposal: Proposal;
  commission: CommissionDetails;
  isCreative: boolean; // true = current user is the artist
  isActive: boolean;   // true = this is the pinned/current proposal
  onAccept?: () => void;
  onDecline?: () => void;
  onEdit?: () => void;
  onUpdatePayment?: (status: 'partially_paid' | 'fully_paid') => void;
  paymentStatus?: PaymentStatus;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'UNPAID',
  partially_paid: 'PARTIALLY PAID',
  fully_paid: 'FULLY PAID',
};

export function ProposalCard({
  proposal: p,
  commission,
  isCreative,
  isActive,
  onAccept,
  onDecline,
  onEdit,
  onUpdatePayment,
  paymentStatus,
}: ProposalCardProps) {
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [delivexpanded, setDelivExpanded] = useState(false);

  const isSuperseded = p.status === 'superseded';
  const isAccepted = p.status === 'accepted';
  const isDeclined = p.status === 'declined';
  const isPending = p.status === 'pending';

  if (isSuperseded) {
    return (
      <div className={styles.supersededWrapper}>
        <button className={styles.supersededToggle} onClick={() => setDelivExpanded(v => !v)}>
          View previous version (v{p.version})
          {delivexpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {delivexpanded && (
          <div className={styles.cardSuperseded}>
            <ProposalCardInner p={p} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${isActive && isAccepted ? styles.cardAccepted : ''}`}>
      <div className={styles.topBorder} />

      <div className={styles.header}>
        <span className={styles.label}>// PROPOSAL{p.version > 1 ? ` — REVISION ${p.version}` : ''}</span>
        <div className={styles.headerRight}>
          {isAccepted && paymentStatus && (
            <span className={`${styles.payBadge} ${styles[`pay_${paymentStatus}`]}`}>
              {PAYMENT_LABELS[paymentStatus]}
            </span>
          )}
          {!isAccepted && (
            <span className={`${styles.statusBadge} ${isDeclined ? styles.statusDeclined : isPending ? styles.statusPending : ''}`}>
              {isDeclined ? 'DECLINED' : isPending ? 'AWAITING RESPONSE' : p.status.toUpperCase()}
            </span>
          )}
          {isCreative && isPending && onEdit && (
            <button className={styles.editBtn} onClick={onEdit}>Edit</button>
          )}
        </div>
      </div>

      <ProposalCardInner p={p} />

      {/* Client actions */}
      {!isCreative && isPending && (
        <div className={styles.actions}>
          <button className={styles.btnAccept} onClick={onAccept}>
            Accept Proposal
          </button>
          <button className={styles.btnDecline} onClick={onDecline}>
            Decline
          </button>
        </div>
      )}

      {/* Creative payment update */}
      {isCreative && isAccepted && isActive && onUpdatePayment && (
        <div className={styles.actions}>
          <button className={styles.btnPayment} onClick={() => setShowPaymentSheet(true)}>
            Update Payment
          </button>
        </div>
      )}

      <div className={styles.bottomBorder} />

      {/* Payment sheet */}
      {showPaymentSheet && (
        <div className={styles.sheetBackdrop} onClick={() => setShowPaymentSheet(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <p className={styles.sheetTitle}>// UPDATE PAYMENT</p>
            <button
              className={styles.sheetOption}
              onClick={() => { onUpdatePayment?.('partially_paid'); setShowPaymentSheet(false); }}
            >
              Mark as Partially Paid
            </button>
            <button
              className={`${styles.sheetOption} ${styles.sheetOptionPrimary}`}
              onClick={() => { onUpdatePayment?.('fully_paid'); setShowPaymentSheet(false); }}
            >
              Mark as Fully Paid
            </button>
            <button className={styles.sheetCancel} onClick={() => setShowPaymentSheet(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalCardInner({ p }: { p: Proposal }) {
  const [delivExpanded, setDelivExpanded] = useState(false);

  return (
    <div className={styles.body}>
      <h3 className={styles.title}>{p.title}</h3>

      {p.description && (
        <p className={styles.description}>{p.description}</p>
      )}

      <div className={styles.priceRow}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>Total</span>
          <span className={styles.price}>PKR {p.total_price.toLocaleString()}</span>
        </div>
        {p.deposit_amount != null && (
          <>
            <div className={styles.priceBlock}>
              <span className={styles.priceLabel}>Deposit</span>
              <span className={styles.priceSecondary}>PKR {p.deposit_amount.toLocaleString()}</span>
            </div>
            <div className={styles.priceBlock}>
              <span className={styles.priceLabel}>Balance</span>
              <span className={styles.priceSecondary}>PKR {(p.total_price - p.deposit_amount).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.meta}>
        {p.delivery_date && (
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>Delivery</span>
            <span className={styles.metaVal}>{formatDate(p.delivery_date)}</span>
          </div>
        )}
        {p.revisions != null && (
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>Revisions</span>
            <span className={styles.metaVal}>{p.revisions}</span>
          </div>
        )}
      </div>

      {p.deliverables && (
        <div className={styles.deliverables}>
          <button className={styles.delivToggle} onClick={() => setDelivExpanded(v => !v)}>
            What you'll get {delivExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {delivExpanded && (
            <p className={styles.delivText}>{p.deliverables}</p>
          )}
        </div>
      )}
    </div>
  );
}
