"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, ArrowLeft, ChevronRight } from 'lucide-react';
import type { ArtistPublicProfile } from '@/lib/types';
import styles from './CommissionEnquiry.module.css';

interface CommissionEnquiryProps {
  artist: ArtistPublicProfile;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4 | 'success';

export function CommissionEnquiry({ artist, onClose }: CommissionEnquiryProps) {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    discipline: '',
    deliverable: '',
    brief: '',
    deadline: '',
    duration: '2 weeks',
    budget: 120000
  });
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToInbox = () => {
    onClose();
    router.push(`/inbox?with=${artist.user.username}`);
  };

  const nextStep = () => {
    if (step === 4) handleSubmit();
    else setStep((prev) => (prev as number) + 1 as Step);
  };

  const prevStep = () => {
    if (step === 1) onClose();
    else setStep((prev) => (prev as number) - 1 as Step);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isStepValid = () => {
    if (step === 1) return formData.discipline && formData.deliverable;
    if (step === 2) return formData.deadline;
    return true;
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={16} /> Close
        </button>

        {step !== 'success' && (
          <div className={styles.progressHeader}>
            <div className={styles.stepIndicator}>
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`${styles.indicatorBar} ${s <= (step as number) ? styles.activeBar : ''}`} 
                />
              ))}
            </div>
            <span className={styles.stepTag}>
              // STEP {step} OF 4 . {
                step === 1 ? 'SCOPE' : 
                step === 2 ? 'DATE' : 
                step === 3 ? 'BUDGET' : 'REVIEW'
              }
            </span>
          </div>
        )}

        <div className={styles.scrollArea}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.title}>What are you<br />booking?</h2>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Discipline</label>
                <div className={styles.chipGrid}>
                  {artist.profile.disciplines.map(d => (
                    <button 
                      key={d}
                      className={`${styles.chip} ${formData.discipline === d ? styles.chipActive : ''}`}
                      onClick={() => setFormData({ ...formData, discipline: d })}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Deliverable</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. 3 spot illustrations"
                  value={formData.deliverable}
                  onChange={e => setFormData({ ...formData, deliverable: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Brief (Optional)</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="A few lines about the project..."
                  value={formData.brief}
                  onChange={e => setFormData({ ...formData, brief: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.title}>When do you<br />need it?</h2>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Deadline</label>
                <input 
                  type="date" 
                  className={styles.input}
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Project Duration</label>
                <div className={styles.chipGrid}>
                  {['1 week', '2 weeks', '1 month', 'Ongoing'].map(d => (
                    <button 
                      key={d}
                      className={`${styles.chip} ${formData.duration === d ? styles.chipActive : ''}`}
                      onClick={() => setFormData({ ...formData, duration: d })}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.infoBox}>
                <span className={styles.infoTag}>// Heads Up</span>
                <p className={styles.infoText}>
                  {artist.user.full_name} is booking from Mar onwards. Earlier dates may not be possible.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.title}>What's the<br />budget?</h2>
              
              <div className={styles.inputGroup}>
                <span className={styles.label}>// PKR</span>
                <div className={styles.budgetValue}>
                  {formData.budget.toLocaleString()}
                </div>
                
                <div className={styles.sliderWrapper}>
                  <input 
                    type="range" 
                    min="10000" 
                    max="500000" 
                    step="5000"
                    className={styles.slider}
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                  />
                  <div className={styles.sliderLabels}>
                    <span>PKR 10K</span>
                    <span>500K</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoBox}>
                <span className={styles.infoTag}>// Their Range</span>
                <p className={styles.infoText}>
                  {artist.user.full_name} typically takes projects in PKR 80k – 200k. Yours is <span style={{ background: 'var(--color-yellow)', color: '#000', padding: '0 4px' }}>in range</span>.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.title}>Send to<br />{artist.user.full_name.split(' ')[0]}?</h2>
              
              <table className={styles.reviewTable}>
                <tbody>
                  <tr className={styles.reviewRow}>
                    <td className={styles.reviewKey}>Discipline</td>
                    <td className={styles.reviewVal}>{formData.discipline}</td>
                  </tr>
                  <tr className={styles.reviewRow}>
                    <td className={styles.reviewKey}>Deliverable</td>
                    <td className={styles.reviewVal}>{formData.deliverable}</td>
                  </tr>
                  <tr className={styles.reviewRow}>
                    <td className={styles.reviewKey}>Deadline</td>
                    <td className={styles.reviewVal}>{formData.deadline}</td>
                  </tr>
                  <tr className={styles.reviewRow}>
                    <td className={styles.reviewKey}>Duration</td>
                    <td className={styles.reviewVal}>{formData.duration}</td>
                  </tr>
                  <tr className={styles.reviewRow}>
                    <td className={styles.reviewKey}>Budget</td>
                    <td className={styles.reviewVal}>{formatCurrency(formData.budget)}</td>
                  </tr>
                </tbody>
              </table>

              <p className={styles.reviewFootnote}>
                They get 48 hours to accept, decline, or counter. You can edit the brief from your inbox after sending.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={64} strokeWidth={1} />
              </div>
              <h2 className={styles.title}>Sent!</h2>
              <p className={styles.infoText}>
                Your brief has been sent to {artist.user.full_name}. We'll notify you when they respond.
              </p>
              <button 
                className="btn btn-primary btn-md" 
                style={{ marginTop: 'var(--space-10)', width: '100%' }}
                onClick={handleGoToInbox}
              >
                Go to Inbox
              </button>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <div className={styles.footer}>
            <button className={`${styles.navBtn} ${styles.btnBack}`} onClick={prevStep}>
              Back
            </button>
            <button 
              className={`${styles.navBtn} ${styles.btnContinue}`} 
              onClick={nextStep}
              disabled={loading || !isStepValid()}
            >
              {loading ? 'Sending...' : step === 4 ? 'Send Brief' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
