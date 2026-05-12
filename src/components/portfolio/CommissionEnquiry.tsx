"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, ArrowLeft, Upload, ImageIcon } from 'lucide-react';
import type { ArtistPublicProfile } from '@/lib/types';
import { submitCommission, uploadBriefReference } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import styles from './CommissionEnquiry.module.css';

interface CommissionEnquiryProps {
  artist: ArtistPublicProfile;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4 | 'success';

function formatDisplayDate(iso: string): string {
  if (!iso) return iso;
  const [year, month, day] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function AvailabilityText({ artist }: { artist: ArtistPublicProfile }) {
  const status = artist.profile.availability;
  const name = artist.user.full_name;
  const availFrom = artist.profile.available_from;

  if (status === 'available' && availFrom) {
    return (
      <>
        {name} is <strong>Available</strong> · Taking projects from {formatDisplayDate(availFrom)}
      </>
    );
  }
  if (status === 'available') {
    return <>{name} is currently <strong>Available</strong></>;
  }
  if (status === 'busy') {
    return <>{name} is currently <strong>Busy</strong> — they may still respond</>;
  }
  return <>{name} is not taking new projects right now</>;
}

export function CommissionEnquiry({ artist, onClose }: CommissionEnquiryProps) {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    discipline: '',
    deliverable: '',
    brief: '',
    deadline: '',
    duration: '2 weeks',
    budget: 120000,
  });
  const [manualBudget, setManualBudget] = useState('120000');
  const [lastTouched, setLastTouched] = useState<'slider' | 'manual'>('slider');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
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

  const handleReferenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeReference = () => {
    setReferenceFile(null);
    setReferencePreview(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFormData(prev => ({ ...prev, budget: val }));
    setManualBudget(String(val));
    setLastTouched('slider');
  };

  const handleManualBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setManualBudget(raw);
    setLastTouched('manual');
    const parsed = parseInt(raw) || 0;
    if (parsed >= 10000) {
      setFormData(prev => ({ ...prev, budget: parsed }));
    }
  };

  const handleManualBudgetBlur = () => {
    const parsed = parseInt(manualBudget) || 0;
    if (parsed < 10000) {
      setManualBudget('10000');
      setFormData(prev => ({ ...prev, budget: 10000 }));
    }
  };

  const sliderValue = Math.min(formData.budget, 500000);

  const getRangeStatus = () => {
    if (!artist.profile.starting_rate) return null;
    if (formData.budget >= artist.profile.starting_rate) return 'in range';
    return 'below range';
  };

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('You need to be logged in to send a commission.');
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      let referenceImageUrl: string | undefined;
      if (referenceFile) {
        const { url } = await uploadBriefReference(user.id, referenceFile);
        referenceImageUrl = url ?? undefined;
      }
      await submitCommission(artist.profile.id, user.id, {
        ...formData,
        referenceImageUrl,
      });
      setStep('success');
    } catch (err) {
      console.error(err);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToInbox = () => {
    onClose();
    router.push(`/messages?with=${artist.user.username}`);
  };

  const nextStep = () => {
    if (step === 4) handleSubmit();
    else setStep((prev) => (prev as number) + 1 as Step);
  };

  const prevStep = () => {
    if (step === 1) onClose();
    else setStep((prev) => (prev as number) - 1 as Step);
  };

  const isStepValid = () => {
    if (step === 1) return formData.discipline && formData.deliverable;
    if (step === 2) return formData.deadline;
    if (step === 3) return formData.budget >= 10000;
    return true;
  };

  const rangeStatus = getRangeStatus();

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.editorialClose} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className={styles.container}>
          {/* Column 1: Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarMeta}>
              <div className={styles.stepMeta}>// PHASE 01</div>
              <h1 className={styles.sidebarTitle}>BOOKING<br />SESSION</h1>
            </div>

            <nav className={styles.nav}>
              {[
                { id: 1, label: 'Scope' },
                { id: 2, label: 'Timeline' },
                { id: 3, label: 'Budget' },
                { id: 4, label: 'Review' }
              ].map(s => (
                <div 
                  key={s.id} 
                  className={`${styles.navItem} ${step === s.id ? styles.navItemActive : ''} ${(typeof step === 'number' && step > s.id) ? styles.navItemDone : ''}`}
                >
                  <div className={styles.navItemDot} />
                  <span className={styles.navItemLabel}>{s.label}</span>
                </div>
              ))}
            </nav>

            <div className={styles.sidebarArtist}>
              <div className={styles.artistAvatar}>
                {artist.user.full_name.charAt(0)}
              </div>
              <div className={styles.artistName}>
                {artist.user.full_name}
              </div>
            </div>
          </aside>

          {/* Column 2: Form Area */}
          <section className={styles.formArea}>
            <div className={styles.scrollArea}>
              {step === 1 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.title}>What are you<br />booking?</h2>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Discipline</label>
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
                    <label className={styles.label}>Deliverable Title</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 3 spot illustrations"
                      value={formData.deliverable}
                      onChange={e => setFormData({ ...formData, deliverable: e.target.value })}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Brief Context</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Describe your project, style requirements, and usage..."
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
                    <label className={styles.label}>Target Deadline</label>
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
                </div>
              )}

              {step === 3 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.title}>Define the<br />budget</h2>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Investment (PKR)</label>
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
                        value={sliderValue}
                        onChange={handleSliderChange}
                      />
                      <div className={styles.sliderLabels}>
                        <span>10K</span>
                        <span>500K+</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.input}
                      value={manualBudget}
                      onChange={handleManualBudgetChange}
                      onBlur={handleManualBudgetBlur}
                      placeholder="Or enter manually..."
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.title}>Review &<br />Commit</h2>
                  
                  <table className={styles.reviewTable}>
                    <tbody>
                      <tr className={styles.reviewRow}>
                        <td className={styles.reviewKey}>Project</td>
                        <td className={styles.reviewVal}>{formData.deliverable || '—'}</td>
                      </tr>
                      <tr className={styles.reviewRow}>
                        <td className={styles.reviewKey}>Deadline</td>
                        <td className={styles.reviewVal}>{formData.deadline ? formatDisplayDate(formData.deadline) : '—'}</td>
                      </tr>
                      <tr className={styles.reviewRow}>
                        <td className={styles.reviewKey}>Budget</td>
                        <td className={styles.reviewVal}>PKR {formData.budget.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className={styles.reviewFootnote}>
                    // NOTE: BY SENDING THIS BRIEF, YOU COMMIT TO THE TERMS DISCUSSED. THE CREATIVE WILL REVIEW AND RESPOND WITHIN 48 HOURS.
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>
                    <CheckCircle2 size={64} strokeWidth={1} />
                  </div>
                  <h2 className={styles.title}>Brief Sent</h2>
                  <p className={styles.infoText}>
                    Your enquiry has been dispatched to {artist.user.full_name}. Track status in your inbox.
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
              <footer className={styles.footer}>
                <div className={styles.footerInfo}>
                  {submitError && <span className="text-error text-xs">{submitError}</span>}
                </div>
                <div className={styles.footerActions}>
                  <button className={`${styles.navBtn} ${styles.btnBack}`} onClick={prevStep}>
                    {step === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    className={`${styles.navBtn} ${styles.btnContinue}`}
                    onClick={nextStep}
                    disabled={loading || !isStepValid()}
                  >
                    {loading ? 'Sending...' : step === 4 ? 'SEND BRIEF' : 'Continue'}
                  </button>
                </div>
              </footer>
            )}
          </section>

          {/* Column 3: Insights Area */}
          <aside className={styles.mediaArea}>
            <div className={styles.insightGroup}>
              <label className={styles.insightLabel}>// Workstation Insights</label>
              <div className={styles.insightContent}>
                <AvailabilityText artist={artist} />
              </div>
            </div>

            {artist.profile.starting_rate && (
              <div className={styles.insightGroup}>
                <label className={styles.insightLabel}>// Starting Rate</label>
                <div className={styles.insightContent}>
                  Starts from PKR {artist.profile.starting_rate.toLocaleString()}
                </div>
              </div>
            )}

            <div className={styles.insightGroup}>
              <label className={styles.insightLabel}>// Reference Image</label>
              <div className={styles.insightContent}>
                {referencePreview ? (
                  <div className={styles.referencePreview}>
                    <img src={referencePreview} alt="Reference" className={styles.referenceImg} />
                    <button className={styles.referenceRemove} onClick={removeReference}>
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.referenceUploadBtn}
                    onClick={() => referenceInputRef.current?.click()}
                    type="button"
                  >
                    <Upload size={14} />
                    <span>Attach Asset</span>
                  </button>
                )}
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleReferenceSelect}
                />
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div className={styles.insightLabel}>// Quick Tip</div>
              <p className={styles.insightContent} style={{ fontSize: '11px', opacity: 0.6 }}>
                Be as specific as possible in your brief context to reduce the need for back-and-forth messages.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
