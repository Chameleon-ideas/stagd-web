"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, CheckCircle2, Download } from 'lucide-react';
import { purchaseTicket } from '@/lib/api';
import { formatPKR, formatDate, formatTime } from '@/lib/utils';
import type { Event } from '@/lib/types';
import styles from './TicketCheckout.module.css';

interface TicketCheckoutProps {
  event: Event;
  onClose: () => void;
}

/**
 * TicketCheckout (Client Component)
 * Refactored for accessibility and Stagd Design System compliance.
 * Now includes Ticket Download functionality.
 */
export function TicketCheckout({ event, onClose }: TicketCheckoutProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = useState(event.ticket_tiers[0] || { id: 'default', name: 'General Admission', price: event.min_price });
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState<{ id: string; qr: string } | null>(null);
  const [showVisual, setShowVisual] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap and Escape key listener
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

    if (step === 2) {
      firstInputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, step]);

  const handlePurchase = async () => {
    if (!formData.name || !formData.email) return;
    
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const res = await purchaseTicket(event.id, {
        tier_id: selectedTier.id,
        quantity,
        buyer_name: formData.name,
        buyer_email: formData.email
      });
      
      setTicketResult({ id: res.ticket_id, qr: res.qr_url });
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setShowVisual(true);
    // In a real app, we'd use html2canvas or a PDF library here.
    // For this demo, we'll show the designed ticket UI.
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className={`${styles.modal} ${showVisual ? styles.modalVisual : ''}`} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="checkout-title"
      >
        <button 
          className={styles.closeBtn} 
          onClick={onClose}
          aria-label="Close checkout"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {!showVisual ? (
          <>
            {step === 1 && (
              <div className={styles.step}>
                <span className={styles.stepTag}>Step 01 / 02</span>
                <h2 id="checkout-title" className={styles.title}>Select Tickets</h2>
                
                <div className={styles.eventSummary}>
                  <div className={styles.eventThumb}>
                    <Image src={event.cover_image_url} alt="" fill className={styles.img} />
                  </div>
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventMeta}>{event.venue_name} · {event.city}</span>
                  </div>
                </div>

                <div className={styles.tierSelector}>
                  <div className={styles.tierHeader}>
                    <span className={styles.tierName}>{selectedTier.name}</span>
                    <span className={styles.tierPrice}>{formatPKR(selectedTier.price)}</span>
                  </div>
                  
                  <div className={styles.qtyControl}>
                    <button 
                      className={styles.qtyBtn} 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} strokeWidth={1.5} />
                    </button>
                    <span className={styles.qtyValue} aria-live="polite">
                      {quantity}
                    </span>
                    <button 
                      className={styles.qtyBtn} 
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      aria-label="Increase quantity"
                      disabled={quantity >= 10}
                    >
                      <Plus size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className={styles.footer}>
                  <div className={styles.total}>
                    <span className={styles.totalLabel}>Total</span>
                    <span className={styles.totalValue}>{formatPKR(selectedTier.price * quantity)}</span>
                  </div>
                  <button 
                    className="btn btn-primary btn-md" 
                    style={{ width: '100%' }} 
                    onClick={() => setStep(2)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.step}>
                <span className={styles.stepTag}>Step 02 / 02</span>
                <h2 id="checkout-title" className={styles.title}>Your Details</h2>
                <p className={styles.subtitle}>Tickets will be sent to your email and accessible via the Stagd app.</p>

                <div className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="buyer-name" className={styles.label}>Full Name</label>
                    <input 
                      id="buyer-name"
                      ref={firstInputRef}
                      type="text" 
                      className={styles.input} 
                      placeholder="Zia Ahmed"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="buyer-email" className={styles.label}>Email Address</label>
                    <input 
                      id="buyer-email"
                      type="email" 
                      className={styles.input} 
                      placeholder="zia@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.footer}>
                  <button 
                    className="btn btn-primary btn-md" 
                    style={{ width: '100%' }} 
                    onClick={handlePurchase}
                    disabled={loading || !formData.name || !formData.email}
                  >
                    {loading ? 'Processing...' : `Pay ${formatPKR(selectedTier.price * quantity)}`}
                  </button>
                  <button 
                    className={styles.backBtn} 
                    onClick={() => setStep(1)}
                    type="button"
                  >
                    Back to tickets
                  </button>
                </div>
              </div>
            )}

            {step === 3 && ticketResult && (
              <div className={styles.step}>
                <div className={styles.successIcon}>
                  <CheckCircle2 size={48} strokeWidth={1.5} />
                </div>
                <h2 id="checkout-title" className={styles.title}>You're Going!</h2>
                <p className={styles.subtitle}>Your ticket is confirmed. Show this QR code at the door.</p>

                <div className={styles.qrWrapper}>
                  <div className={styles.qrContainer}>
                    <Image src={ticketResult.qr} alt="Ticket QR Code" fill className={styles.qrImg} />
                  </div>
                  <span className={styles.ticketId}>{ticketResult.id}</span>
                </div>

                <div className={styles.footer}>
                  <button 
                    className="btn btn-accent btn-md" 
                    style={{ width: '100%' }} 
                    onClick={handleDownload}
                  >
                    <Download size={18} style={{ marginRight: 8 }} />
                    Download Ticket
                  </button>
                  <button className={styles.backBtn} onClick={onClose}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Designed Ticket Visual ────────────────────────── */
          <div className={styles.ticketVisual}>
            <div className={styles.ticketVisualInner}>
              <div className={styles.ticketVisualTop}>
                <div className={styles.ticketVisualBrand}>STAGD</div>
                <div className={styles.ticketVisualId}>{ticketResult?.id}</div>
              </div>

              <div className={styles.ticketVisualImage}>
                <Image src={event.cover_image_url} alt="" fill className={styles.img} />
                <div className={styles.editorialGradient} />
                <div className={styles.ticketVisualType}>{event.event_type}</div>
              </div>

              <div className={styles.ticketVisualInfo}>
                <h3 className={styles.ticketVisualTitle}>{event.title}</h3>
                
                <div className={styles.ticketVisualMeta}>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>Date</span>
                    <span className={styles.visualValue}>{formatDate(event.starts_at)}</span>
                  </div>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>Time</span>
                    <span className={styles.visualValue}>{formatTime(event.starts_at)}</span>
                  </div>
                </div>

                <div className={styles.ticketVisualMeta}>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>Venue</span>
                    <span className={styles.visualValue}>{event.venue_name}</span>
                  </div>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>Tier</span>
                    <span className={styles.visualValue}>{selectedTier.name} x {quantity}</span>
                  </div>
                </div>

                <hr className={styles.visualDivider} />

                <div className={styles.ticketVisualQrRow}>
                  <div className={styles.visualQr}>
                    <Image src={ticketResult?.qr || ''} alt="QR" fill />
                  </div>
                  <div className={styles.visualBuyer}>
                    <span className={styles.visualLabel}>Admit One</span>
                    <span className={styles.visualValue}>{formData.name}</span>
                  </div>
                </div>
              </div>

              <div className={styles.ticketVisualFooter}>
                This ticket is valid for one-time entry only. No refunds. Stagd v1.0
              </div>
            </div>
            
            <div className={styles.visualActions}>
              <button className="btn btn-primary btn-md" onClick={() => window.print()}>
                Print Ticket
              </button>
              <button className={styles.backBtn} onClick={() => setShowVisual(false)}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
