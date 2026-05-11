'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { EventReview } from '@/lib/types';

interface Props {
  eventId: string;
  organiserId: string;
  initialReviews: EventReview[];
  startsAt: string;
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= rating ? 'var(--text-accent)' : 'var(--border-color)'}
          fill={i <= rating ? 'var(--text-accent)' : 'none'}
        />
      ))}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function EventReviewsSection({ eventId, organiserId, initialReviews, startsAt }: Props) {
  const { user, isLoading } = useAuth();
  const [reviews, setReviews] = useState<EventReview[]>(initialReviews);
  const [eligibility, setEligibility] = useState<{ hasTicket: boolean; hasReviewed: boolean } | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const eventHappened = new Date(startsAt).getTime() < Date.now();

  useEffect(() => {
    if (isLoading || !user || user.id === organiserId) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ op: 'checkEventReviewEligibility', eventId }),
      });
      const data = await res.json();
      setEligibility({ hasTicket: data.hasTicket, hasReviewed: data.hasReviewed });
    });
  }, [user, isLoading, eventId, organiserId]);

  const handleSubmit = async () => {
    if (selectedStar === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          op: 'submitEventReview',
          eventId,
          rating: selectedStar,
          body: reviewBody.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const newReview: EventReview = {
        id: `temp-${Date.now()}`,
        event_id: eventId,
        reviewer_id: user!.id,
        reviewer: { id: user!.id, full_name: user!.full_name, username: user!.username, avatar_url: user!.avatar_url },
        rating: selectedStar,
        body: reviewBody.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setSubmitted(true);
      setEligibility((prev) => prev ? { ...prev, hasReviewed: true } : prev);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const showForm =
    user &&
    user.id !== organiserId &&
    eventHappened &&
    eligibility?.hasTicket &&
    !eligibility.hasReviewed &&
    !submitted;

  return (
    <section>
      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-accent)',
          letterSpacing: '0.12em',
          margin: 0,
        }}>
          // REVIEWS
        </p>
        {reviews.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarRow rating={Math.round(avgRating)} size={10} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-faint)',
              letterSpacing: '0.06em',
            }}>
              {avgRating} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>

      {/* ── review form ── */}
      {showForm && (
        <div style={{
          border: '1px solid var(--border-color)',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-faint)',
            letterSpacing: '0.1em',
          }}>
            LEAVE A REVIEW
          </span>

          {/* star picker */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map((i) => {
              const active = i <= (hoveredStar || selectedStar);
              return (
                <button
                  key={i}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                  aria-label={`${i} star${i > 1 ? 's' : ''}`}
                >
                  <Star
                    size={22}
                    color={active ? 'var(--text-accent)' : 'var(--border-color)'}
                    fill={active ? 'var(--text-accent)' : 'none'}
                    style={{ transition: 'color 100ms, fill 100ms' }}
                  />
                </button>
              );
            })}
          </div>

          {/* body textarea */}
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            placeholder="Share your experience... (optional)"
            maxLength={500}
            rows={3}
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'var(--bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.6,
              padding: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--text-faint)',
              letterSpacing: '0.06em',
            }}>
              {reviewBody.length}/500
            </span>
            <button
              onClick={handleSubmit}
              disabled={selectedStar === 0 || submitting}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                fontWeight: 700,
                padding: '10px 24px',
                background: selectedStar > 0 ? 'var(--text)' : 'var(--bg-surface)',
                color: selectedStar > 0 ? 'var(--bg)' : 'var(--text-faint)',
                border: '1px solid var(--border-color)',
                cursor: selectedStar > 0 ? 'pointer' : 'default',
                transition: 'background 150ms, color 150ms',
              }}
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
            </button>
          </div>

          {submitError && (
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#E63946',
              margin: 0,
            }}>
              {submitError}
            </p>
          )}
        </div>
      )}

      {/* ── review list ── */}
      {reviews.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-faint)',
          letterSpacing: '0.06em',
        }}>
          {eventHappened ? 'NO REVIEWS YET.' : 'REVIEWS OPEN AFTER THE EVENT.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {reviews.map((review, idx) => (
            <div
              key={review.id}
              style={{
                padding: '18px 0',
                borderTop: idx === 0 ? '1px solid var(--border-color)' : 'none',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* reviewer + stars + date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <Image
                      src={review.reviewer?.avatar_url || '/images/default-avatar.png'}
                      alt={review.reviewer?.full_name ?? ''}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text)',
                      lineHeight: 1,
                    }}>
                      {review.reviewer?.full_name ?? 'Anonymous'}
                    </span>
                    <StarRow rating={review.rating} size={10} />
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--text-faint)',
                  letterSpacing: '0.08em',
                }}>
                  {formatRelative(review.created_at).toUpperCase()}
                </span>
              </div>

              {/* body */}
              {review.body && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  lineHeight: 1.65,
                  color: 'var(--text-muted)',
                  margin: 0,
                }}>
                  {review.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
