"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { verifyTicket } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { VerifyResult } from '@/lib/types';
import { 
  Camera, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  User, 
  ShieldCheck,
  History,
  Info
} from 'lucide-react';
import styles from './scanner.module.css';

type ScanState = 'idle' | 'scanning' | 'processing' | 'result';

interface RecentScan extends VerifyResult {
  timestamp: Date;
}

export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerInner />
    </Suspense>
  );
}

function ScannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const NO_FOOTER_ROUTES = ["/explore", "/messages", "/scanner"];
  const eventId = searchParams.get('eventId') ?? undefined;

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<VerifyResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedRaw, setLastScannedRaw] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const processingRef = useRef(false);
  const eventIdRef = useRef(eventId);
  
  useEffect(() => { eventIdRef.current = eventId; }, [eventId]);

  // Load real attendance stats from DB
  useEffect(() => {
    async function loadStats() {
      let totalQuery = supabase.from('tickets').select('*', { count: 'exact', head: true });
      let checkedInQuery = supabase.from('tickets').select('*', { count: 'exact', head: true }).not('scanned_at', 'is', null);
      if (eventId) {
        totalQuery = totalQuery.eq('event_id', eventId);
        checkedInQuery = checkedInQuery.eq('event_id', eventId);
      }
      const [{ count: total }, { count: checkedIn }] = await Promise.all([totalQuery, checkedInQuery]);
      setStats({ total: total ?? 0, checkedIn: checkedIn ?? 0 });
    }
    loadStats();
  }, [eventId]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    streamRef.current = null;
    processingRef.current = false;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && !processingRef.current) {
      processingRef.current = true;
      setScanState('processing');
      stopCamera();

      const raw = code.data.trim();
      setLastScannedRaw(raw);
      verifyTicket(raw, eventIdRef.current)
        .then(result => {
          setScanResult(result);
          setScanState('result');
          
          // Add to recent scans
          setRecentScans(prev => [{ ...result, timestamp: new Date() }, ...prev].slice(0, 10));
          
          if (result.status === 'valid') {
            setStats(s => ({ ...s, checkedIn: s.checkedIn + 1 }));
          } else if (result.status === 'already_used') {
            // already counted — no change needed
          }
        })
        .catch(() => {
          setScanError('Failed to reach verification server.');
          setScanState('result');
        });
      return;
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const startScanner = async () => {
    setScanResult(null);
    setScanError(null);
    processingRef.current = false;
    setScanState('scanning');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setScanError('Camera access denied. Enable camera permission and try again.');
      setScanState('idle');
    }
  };

  const reset = () => {
    stopCamera();
    setScanResult(null);
    setScanError(null);
    setScanState('idle');
  };

  const getStatusConfig = (status: string | undefined) => {
    switch (status) {
      case 'valid':
        return { 
          icon: <CheckCircle2 size={48} />, 
          label: 'ACCESS GRANTED', 
          color: 'var(--color-success, #22c55e)',
          bg: 'rgba(34, 197, 94, 0.1)'
        };
      case 'already_used':
        return { 
          icon: <AlertCircle size={48} />, 
          label: 'ALREADY SCANNED', 
          color: 'var(--color-yellow)',
          bg: 'rgba(255, 230, 0, 0.1)'
        };
      case 'wrong_event':
        return { 
          icon: <XCircle size={48} />, 
          label: 'WRONG EVENT', 
          color: 'var(--color-yellow)',
          bg: 'rgba(255, 230, 0, 0.1)'
        };
      case 'not_recognised':
      default:
        return { 
          icon: <XCircle size={48} />, 
          label: 'INVALID TICKET', 
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)'
        };
    }
  };

  const config = getStatusConfig(scanResult?.status);

  return (
    <div className={styles.container}>
      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <button className={styles.backLink} onClick={() => router.back()}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className={styles.sidebarMeta}>
          <div className={styles.stepMeta}>DOOR OPERATIONS</div>
          <h1 className={styles.title}>SCANNER</h1>
        </div>

        <div className={styles.attendanceStats}>
          <div className={styles.stepMeta}>ATTENDANCE DATA</div>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{stats.checkedIn}</span>
              <span className={styles.statLab}>IN VENUE</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{stats.total || '—'}</span>
              <span className={styles.statLab}>TOTAL SOLD</span>
            </div>
          </div>
        </div>

        <div className={styles.eventContext}>
          <div className={styles.eventTitle}>{scanResult?.event_title || 'LIVE EVENT SCAN'}</div>
          <div className={styles.eventMeta}>
            <span><ShieldCheck size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> SECURE VERIFICATION MODE</span>
            {!eventId && <span style={{ color: 'var(--color-yellow)' }}>⚠ GLOBAL SCANNING ACTIVE</span>}
          </div>
        </div>
      </aside>

      {/* ── MAIN SCAN AREA ────────────────────────────────────────── */}
      <main className={styles.scanArea}>
        <div className={styles.scannerHeader}>
          <div className={styles.scannerLabel}>DOOR ACCESS</div>
          <p className={styles.scannerDesc}>
            Verify digital passes by aligning the QR code within the frame.
          </p>
        </div>

        <div className={styles.cameraInterface}>
          {scanState === 'idle' && (
            <div className={styles.startPlaceholder}>
              <div className={styles.cameraArt}>
                <Camera size={64} strokeWidth={1} />
              </div>
              <button onClick={startScanner} className="btn btn-primary btn-lg" style={{ minWidth: 240 }}>
                OPEN SCANNER
              </button>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className={styles.cameraWrapper}>
              <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className={styles.scanOverlay}>
                <div className={styles.scanFrame}>
                  <div className={styles.scanLine} />
                </div>
              </div>
              <button 
                onClick={reset} 
                className="btn btn-secondary btn-sm" 
                style={{ position: 'absolute', bottom: 20, right: 20 }}
              >
                CLOSE
              </button>
            </div>
          )}

          {scanState === 'processing' && (
            <div className={styles.startPlaceholder}>
              <div className={styles.cameraArt}>
                <div className={styles.spin} style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTopColor: 'var(--color-yellow)', borderRadius: '50%' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.1em' }}>
                DECRYPTING PASS...
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── ACTIVITY AREA ────────────────────────────────────────── */}
      <aside className={styles.activityArea}>
        <div className={styles.activityHeader}>RECENT ACTIVITY</div>
        
        <div className={styles.activityList}>
          {recentScans.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>
              NO SCAN HISTORY YET
            </div>
          ) : (
            recentScans.map((scan, i) => {
              const cfg = getStatusConfig(scan.status);
              return (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityStatus} style={{ background: cfg.color }} />
                  <div className={styles.activityInfo}>
                    <div className={styles.activityName}>{scan.buyer_name || 'ANONYMOUS GUEST'}</div>
                    <div className={styles.activityMeta}>
                      {scan.tier_name} · {scan.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ color: cfg.color }}>
                    {scan.status === 'valid' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 'auto', padding: 24, background: 'var(--bg)', border: '1.5px solid var(--border-color)', borderRadius: 2 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info size={16} style={{ color: 'var(--color-yellow)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              STAGD ENCRYPTION ENSURES EVERY TICKET IS UNIQUE AND CANNOT BE REPLICATED.
            </div>
          </div>
        </div>
      </aside>

      {/* ── RESULT MODAL ────────────────────────────────────────── */}
      {scanState === 'result' && (
        <div className={styles.resultContainer} onClick={startScanner}>
          <div className={styles.resultCard} onClick={e => e.stopPropagation()}>
            <div className={styles.resultIcon} style={{ color: config.color }}>
              {config.icon}
            </div>
            
            <div className={styles.resultStatus} style={{ color: config.color }}>
              {config.label}
            </div>

            <div className={styles.resultDetails}>
              {scanResult?.buyer_name && (
                <div className={styles.detailRow}>
                  <span>GUEST</span>
                  <strong>{scanResult.buyer_name}</strong>
                </div>
              )}
              {scanResult?.tier_name && (
                <div className={styles.detailRow}>
                  <span>TIER</span>
                  <strong>{scanResult.tier_name}</strong>
                </div>
              )}
              {lastScannedRaw && (
                <div className={styles.detailRow}>
                  <span>SCANNED</span>
                  <strong style={{ fontSize: 11, wordBreak: 'break-all' }}>{lastScannedRaw}</strong>
                </div>
              )}
              <div className={styles.detailRow}>
                <span>TIMESTAMP</span>
                <strong>{new Date().toLocaleTimeString('en-GB')}</strong>
              </div>
            </div>

            <button onClick={startScanner} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              CONTINUE SCANNING
            </button>
            <button 
              onClick={reset} 
              className="btn btn-ghost btn-sm" 
              style={{ marginTop: 16, width: '100%' }}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
