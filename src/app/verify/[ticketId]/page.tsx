"use client";

import { use, useEffect, useState } from 'react';
import { verifyTicket } from '@/lib/api';
import { formatScanTime } from '@/lib/utils';
import type { VerifyResult } from '@/lib/types';
import styles from './page.module.css';

interface VerifyPageProps {
  params: Promise<{ ticketId: string }>;
}

/**
 * Ticket Verification Page (Client Component)
 * Full-screen interface for bouncers/organizers.
 */
export default function VerifyPage({ params }: VerifyPageProps) {
  const { ticketId } = use(params);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTicket() {
      try {
        setLoading(true);
        const data = await verifyTicket(ticketId);
        setResult(data);
      } catch (err) {
        console.error(`Verification error for ${ticketId}:`, err);
        setError('Failed to reach verification server.');
      } finally {
        setLoading(false);
      }
    }
    checkTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className={`${styles.page} ${styles.loading}`}>
        <div className={styles.spinner} />
        <h1 className={styles.title}>VERIFYING...</h1>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`${styles.page} ${styles.not_recognised}`}>
        <h1 className={styles.title}>ERROR</h1>
        <p className={styles.errorMsg}>{error || 'Something went wrong.'}</p>
        <button className={styles.closeBtn} onClick={() => window.location.href = '/'}>
          BACK TO HOME
        </button>
      </div>
    );
  }

  const isSuccess = result.status === 'valid';
  const isUsed = result.status === 'already_used';
  const isError = result.status === 'not_recognised';

  return (
    <div className={`${styles.page} ${styles[result.status]}`}>
      <main className={styles.container}>
        {/* Status Indicator */}
        <div className={styles.iconWrapper}>
          {isSuccess && <span className={styles.icon}>✓</span>}
          {isUsed && <span className={styles.icon}>!</span>}
          {isError && <span className={styles.icon}>✕</span>}
        </div>

        <h1 className={styles.title}>
          {isSuccess && 'TICKET VALID'}
          {isUsed && 'ALREADY USED'}
          {isError && 'INVALID TICKET'}
        </h1>

        {/* Details */}
        <div className={styles.details}>
          {isSuccess && (
            <>
              <div className={styles.row}>
                <span className={styles.label}>Event</span>
                <span className={styles.value}>{result.event_title}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Buyer</span>
                <span className={styles.value}>{result.buyer_name}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Tier</span>
                <span className={styles.value}>{result.tier_name} x {result.quantity}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Ticket ID</span>
                <span className={styles.value}>{result.ticket_id}</span>
              </div>
            </>
          )}

          {isUsed && (
            <>
              <div className={styles.row}>
                <span className={styles.label}>Previous Scan</span>
                <span className={styles.value}>{result.scanned_at ? formatScanTime(result.scanned_at) : 'Unknown'}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Buyer</span>
                <span className={styles.value}>{result.buyer_name}</span>
              </div>
            </>
          )}

          {isError && (
            <p className={styles.errorMsg}>
              This QR code is not recognized by the Stagd system. Ensure the attendee is using the official Stagd app.
            </p>
          )}
        </div>

        {/* Action */}
        <div className={styles.footer}>
          <button 
            className={styles.closeBtn}
            onClick={() => window.close()}
          >
            CLOSE
          </button>
        </div>
      </main>
    </div>
  );
}
