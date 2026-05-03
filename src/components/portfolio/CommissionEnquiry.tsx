"use client";

import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { ArtistPublicProfile } from '@/lib/types';
import styles from './CommissionEnquiry.module.css';

interface CommissionEnquiryProps {
  artist: ArtistPublicProfile;
  onClose: () => void;
}

/**
 * CommissionEnquiry (Client Component)
 * Refactored for accessibility and Stagd Design System compliance.
 */
export function CommissionEnquiry({ artist, onClose }: CommissionEnquiryProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    if (step === 1) {
      firstInputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, step]);

  const handleSubmit = async () => {
    if (!formData.budget) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to send enquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className={styles.modal} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="comm-title"
      >
        <button 
          className={styles.closeBtn} 
          onClick={onClose}
          aria-label="Close enquiry"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {step === 1 && (
          <div className={styles.step}>
            <span className={styles.stepTag}>Step 01 / 02</span>
            <h2 id="comm-title" className={styles.title}>New Commission</h2>
            <p className={styles.subtitle}>Enquire about a custom project with {artist.user.full_name}.</p>

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="proj-title" className={styles.label}>Project Title</label>
                <input 
                  id="proj-title"
                  ref={firstInputRef}
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Mural for new cafe"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="proj-brief" className={styles.label}>Brief / Description</label>
                <textarea 
                  id="proj-brief"
                  className={styles.textarea} 
                  placeholder="Tell the artist what you're looking for..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button 
                className="btn btn-primary btn-md" 
                style={{ width: '100%' }} 
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.description}
              >
                Next: Budget & Timing
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <span className={styles.stepTag}>Step 02 / 02</span>
            <h2 id="comm-title" className={styles.title}>Project Scope</h2>
            
            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="proj-budget" className={styles.label}>Estimated Budget (PKR)</label>
                <input 
                  id="proj-budget"
                  type="text" 
                  className={styles.input} 
                  placeholder={`Min. ${artist.profile.starting_rate}`}
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="proj-deadline" className={styles.label}>Desired Deadline</label>
                <input 
                  id="proj-deadline"
                  type="date" 
                  className={styles.input} 
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button 
                className="btn btn-primary btn-md" 
                style={{ width: '100%' }} 
                onClick={handleSubmit}
                disabled={loading || !formData.budget}
              >
                {loading ? 'Sending...' : 'Send Enquiry'}
              </button>
              <button 
                className={styles.backBtn} 
                onClick={() => setStep(1)}
                type="button"
              >
                <ArrowLeft size={14} style={{ marginRight: 8 }} />
                Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} strokeWidth={1.5} color="var(--color-yellow)" />
            </div>
            <h2 id="comm-title" className={styles.title}>Brief Sent</h2>
            <p className={styles.subtitle}>
              Your brief has been sent to {artist.user.full_name}. You can now start a conversation to finalize the details.
            </p>

            <div className={styles.footer} style={{ gap: 'var(--space-4)', flexDirection: 'column', display: 'flex' }}>
              <button 
                className="btn btn-primary btn-md" 
                style={{ width: '100%' }} 
                onClick={() => window.location.href = `/messages?recipient=${artist.user.id}`}
              >
                OPEN CHAT
              </button>
              <button 
                className="btn btn-secondary btn-md" 
                style={{ width: '100%' }} 
                onClick={onClose}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
