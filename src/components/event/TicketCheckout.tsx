"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, CheckCircle2, Download } from 'lucide-react';
import { generateBrandedQR } from '@/lib/qr';
import { useAuth } from '@/lib/auth';
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
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = useState(event.ticket_tiers[0] || { id: 'default', name: 'General Admission', price: event.min_price });
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.full_name ?? '',
    email: user?.email ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
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
    setPurchaseError(null);
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tierId: selectedTier.id,
          quantity,
          buyerName: formData.name,
          buyerEmail: formData.email,
          ...(user?.id ? { buyerId: user.id } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const qrDataUrl = await generateBrandedQR(data.ticket_id);
      setTicketResult({ id: data.ticket_id, qr: qrDataUrl });
      setStep(3);
    } catch (err: any) {
      setPurchaseError(err.message ?? 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ticketResult) return;
    
    // Create a hidden canvas to render the ticket
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions for a high-res ticket (800x1200)
    canvas.width = 800;
    canvas.height = 1200;

    // Helper to load images for canvas
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      // 1. Background with Grid/Texture
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add diagonal stripe texture to bottom half
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 1;
      for (let i = -canvas.height; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + canvas.height, canvas.height);
        ctx.stroke();
      }

      // 2. Header (Black) with Logo
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, canvas.width, 100);
      
      // Load and draw the wordmark logo
      const logoImg = await loadImage('/images/stagd-logo.svg');
      const logoWidth = 140;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      ctx.drawImage(logoImg, 40, (100 - logoHeight) / 2, logoWidth, logoHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SERIAL NO: ${ticketResult.id.toUpperCase()}`, canvas.width - 40, 60);

      // 3. Cover Image with Dusk Treatment
      const coverImg = await loadImage(event.cover_image_url || '');
      const coverHeight = 450;
      ctx.drawImage(coverImg, 0, 100, canvas.width, coverHeight);
      
      // Dusk Filter (Bottom to Top)
      const grad = ctx.createLinearGradient(0, 100 + coverHeight, 0, 100);
      grad.addColorStop(0, 'rgba(0,0,0,0.8)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 100, canvas.width, coverHeight);

      // Status Badge (Yellow)
      ctx.fillStyle = '#FFDE0D';
      ctx.fillRect(canvas.width - 180, 120, 140, 40);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL PASS', canvas.width - 110, 145);

      // 4. Content Area
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111111';
      ctx.font = '900 64px sans-serif'; // Anton style
      ctx.fillText(event.title.toUpperCase(), 40, 630);

      // Metadata Grid
      ctx.font = '14px monospace';
      ctx.fillStyle = '#888888';
      ctx.fillText('// DATE', 40, 690);
      ctx.fillText('// TIME', 420, 690);
      
      ctx.fillStyle = '#111111';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(formatDate(event.starts_at).toUpperCase(), 40, 730);
      ctx.fillText(formatTime(event.starts_at).toUpperCase(), 420, 730);

      ctx.font = '14px monospace';
      ctx.fillStyle = '#888888';
      ctx.fillText('// VENUE', 40, 800);
      ctx.fillText('// TIER', 420, 800);
      
      ctx.fillStyle = '#111111';
      ctx.font = '900 28px sans-serif';
      ctx.fillText((event.venue_name || 'KARACHI').toUpperCase(), 40, 840);
      ctx.fillText(`${selectedTier.name.toUpperCase()} x ${quantity}`, 420, 840);

      // Cutout circles (aesthetic)
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(0, 900, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width, 900, 30, 0, Math.PI * 2);
      ctx.fill();

      // Divider
      ctx.strokeStyle = '#111111';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 900);
      ctx.lineTo(740, 900);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. QR Code & Buyer Info
      const qrImg = await loadImage(ticketResult.qr);
      ctx.drawImage(qrImg, 40, 940, 200, 200);

      ctx.fillStyle = '#111111';
      ctx.font = '900 14px monospace';
      ctx.fillText('ADMIT ONE //', 280, 980);
      
      ctx.fillStyle = '#111111';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(formData.name.toUpperCase(), 280, 1040);
      
      ctx.fillStyle = '#888888';
      ctx.font = '14px monospace';
      ctx.fillText(`SERIAL_AUTH: ${ticketResult.id.toUpperCase()}`, 280, 1085);

      // Footer
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 1140, canvas.width, 60);
      ctx.fillStyle = '#FFDE0D';
      ctx.font = '900 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VALID FOR ONE-TIME ENTRY ONLY · NO REFUNDS · POWERED BY STAGD.PK', canvas.width / 2, 1175);

      // Trigger Download using Data URL (often more reliable for filenames in some browsers)
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `stagd-ticket-${ticketResult.id.slice(-8).toLowerCase()}.png`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
    } catch (err) {
      console.error('Download failed:', err);
      // If it's a security error (tainted canvas), explain why
      if (err instanceof Error && (err.name === 'SecurityError' || err.message.includes('tainted'))) {
        alert('Could not download image due to security restrictions on the event photo. Please take a screenshot or use the print option.');
      } else {
        alert('Download failed. Please try again or use the print option.');
      }
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
                <span className={styles.stepTag}>{user ? 'Step 01 / 01' : 'Step 01 / 02'}</span>
                <h2 id="checkout-title" className={styles.title}>Select Tickets</h2>
                
                <div className={styles.eventSummary}>
                  <div className={styles.eventThumb}>
                    {event.cover_image_url && <Image src={event.cover_image_url} alt="" fill className={styles.img} />}
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
                    onClick={() => user ? handlePurchase() : setStep(2)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : user ? `Pay ${formatPKR(selectedTier.price * quantity)}` : 'Continue'}
                  </button>
                  {user && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8 }}>
                      AS {user.full_name.toUpperCase()} · {user.email}
                    </p>
                  )}
                  {purchaseError && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ef4444', marginTop: 12, textTransform: 'uppercase' }}>
                      {purchaseError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.step}>
                <span className={styles.stepTag}>Step 02 / 02</span>
                <h2 id="checkout-title" className={styles.title}>Your Details</h2>
                <p className={styles.subtitle}>Tickets will be sent to your email and accessible via the Stag'd app.</p>

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
                  {purchaseError && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ef4444', marginTop: 12, textTransform: 'uppercase' }}>
                      {purchaseError}
                    </p>
                  )}
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
                    <Image 
                      src={ticketResult.qr} 
                      alt="Ticket QR Code" 
                      fill 
                      unoptimized 
                      className={styles.qrImg} 
                    />
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
          /* ── Designed Ticket Visual (High-Fidelity) ── */
          <div className={styles.ticketVisual}>
            <div className={styles.ticketVisualInner}>
              <div className={styles.ticketVisualTop}>
                <div className={styles.ticketVisualLogo}>
                  <Image 
                    src="/images/stagd-logo.svg" 
                    alt="Stagd" 
                    width={80} 
                    height={32} 
                    className={styles.wordmark}
                  />
                </div>
                <div className={styles.ticketVisualId}>SERIAL: {ticketResult?.id.toUpperCase()}</div>
              </div>

              <div className={styles.ticketVisualImage}>
                {event.cover_image_url && <Image src={event.cover_image_url} alt="" fill className={styles.img} />}
                <div className={styles.editorialGradient} />
                <div className={styles.ticketVisualType}>OFFICIAL PASS</div>
                <div className={styles.ticketVisualWatermark}>{event.event_type?.toUpperCase()}</div>
              </div>

              <div className={styles.ticketVisualInfo}>
                <h3 className={styles.ticketVisualTitle}>{event.title}</h3>
                
                <div className={styles.ticketVisualMetaRow}>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>// DATE</span>
                    <span className={styles.visualValue}>{formatDate(event.starts_at).toUpperCase()}</span>
                  </div>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>// TIME</span>
                    <span className={styles.visualValue}>{formatTime(event.starts_at).toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles.ticketVisualMetaRow}>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>// VENUE</span>
                    <span className={styles.visualValue}>{(event.venue_name || 'Karachi').toUpperCase()}</span>
                  </div>
                  <div className={styles.visualMetaCol}>
                    <span className={styles.visualLabel}>// TIER</span>
                    <span className={styles.visualValue}>{selectedTier.name.toUpperCase()} x {quantity}</span>
                  </div>
                </div>

                <div className={styles.visualCutoutRow}>
                   <div className={styles.visualCutout} />
                   <hr className={styles.visualDivider} />
                   <div className={styles.visualCutout} />
                </div>

                <div className={styles.ticketVisualQrRow}>
                  <div className={styles.visualQr}>
                    <Image 
                      src={ticketResult?.qr || ''} 
                      alt="QR" 
                      fill 
                      unoptimized 
                    />
                  </div>
                  <div className={styles.visualBuyer}>
                    <span className={styles.visualLabel}>ADMIT ONE //</span>
                    <span className={styles.visualValueName}>{formData.name.toUpperCase()}</span>
                    <span className={styles.visualSerial}>AUTH_ID: {ticketResult?.id.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.ticketVisualFooter}>
                VALID FOR ONE-TIME ENTRY ONLY · NO REFUNDS · STAG'D V1.0
              </div>
            </div>
            
            <div className={styles.visualActions}>
              <button className="btn btn-accent btn-md" style={{ width: '100%' }} onClick={handleDownload}>
                <Download size={18} style={{ marginRight: 8 }} />
                Download PNG Pass
              </button>
              <button className={styles.backBtn} onClick={() => setShowVisual(false)}>
                Back to confirmation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
