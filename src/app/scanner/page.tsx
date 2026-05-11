"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import jsQR from 'jsqr';
import { verifyTicket } from '@/lib/api';
import type { VerifyResult } from '@/lib/types';
import styles from './scanner.module.css';

type ScanState = 'idle' | 'scanning' | 'processing' | 'result';

export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerInner />
    </Suspense>
  );
}

function ScannerInner() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') ?? undefined;

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<VerifyResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const processingRef = useRef(false);
  const eventIdRef = useRef(eventId);
  useEffect(() => { eventIdRef.current = eventId; }, [eventId]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
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

      verifyTicket(code.data, eventIdRef.current)
        .then(result => {
          setScanResult(result);
          setScanState('result');
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

  const statusColor = scanResult
    ? scanResult.status === 'valid' ? '#22c55e'
    : scanResult.status === 'already_used' ? '#f59e0b'
    : scanResult.status === 'wrong_event' ? '#f59e0b'
    : '#ef4444'
    : '#ef4444';

  return (
    <main className={styles.scannerPage}>
      <div className="container">
        <div className={styles.scannerLayout}>

          <div className={styles.scannerLeft}>
            <div className={styles.header}>
              <span className="chip chip-accent">Door Staff</span>
              <h1>Ticket Scanner</h1>
              <p>Point camera at a Stagd QR code to verify entry.</p>
              {!eventId && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f59e0b', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚠ No event selected — tickets from any event will be accepted
                </p>
              )}
            </div>

            {scanState === 'idle' && (
              <div className={styles.startState}>
                {scanError && (
                  <p style={{ color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 16 }}>
                    {scanError}
                  </p>
                )}
                <div className={styles.cameraIcon}>📷</div>
                <button onClick={startScanner} className="btn btn-primary btn-lg">
                  Open Camera
                </button>
              </div>
            )}

            {scanState === 'scanning' && (
              <div className={styles.cameraView}>
                <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                {/* Hidden canvas used for frame decoding — never shown */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className={styles.overlay}>
                  <div className={styles.frame} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 12 }}>
                  ALIGN QR CODE WITHIN FRAME
                </p>
                <div className={styles.controls}>
                  <button onClick={reset} className="btn btn-secondary btn-md">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {scanState === 'processing' && (
              <div className={styles.startState}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aaa' }}>
                  VERIFYING...
                </div>
              </div>
            )}

            {scanState === 'result' && (
              <div
                className={styles.resultCard}
                style={{ borderLeft: `3px solid ${statusColor}` }}
              >
                <div className={styles.resultIcon} style={{ color: statusColor }}>
                  {scanResult?.status === 'valid' && '✓'}
                  {scanResult?.status === 'already_used' && '!'}
                  {scanResult?.status === 'wrong_event' && '!'}
                  {(scanResult?.status === 'not_recognised' || scanError) && '✕'}
                </div>

                <h2>
                  {scanResult?.status === 'valid' && 'Access Granted'}
                  {scanResult?.status === 'already_used' && 'Already Scanned'}
                  {scanResult?.status === 'wrong_event' && 'Wrong Event'}
                  {scanResult?.status === 'not_recognised' && 'Invalid Ticket'}
                  {scanError && 'Verification Error'}
                </h2>

                {scanResult?.status === 'wrong_event' && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f59e0b', margin: '4px 0 0' }}>
                    Ticket is for: {scanResult.event_title ?? 'a different event'}
                  </p>
                )}

                {scanResult && (
                  <div className={styles.resultDetails}>
                    {scanResult.buyer_name && (
                      <div className={styles.detailRow}>
                        <span>Guest</span>
                        <strong>{scanResult.buyer_name}</strong>
                      </div>
                    )}
                    {scanResult.tier_name && (
                      <div className={styles.detailRow}>
                        <span>Tier</span>
                        <strong>{scanResult.tier_name}</strong>
                      </div>
                    )}
                    {scanResult.event_title && (
                      <div className={styles.detailRow}>
                        <span>Event</span>
                        <strong>{scanResult.event_title}</strong>
                      </div>
                    )}
                    {scanResult.scanned_at && (
                      <div className={styles.detailRow}>
                        <span>First scanned</span>
                        <strong>{new Date(scanResult.scanned_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong>
                      </div>
                    )}
                  </div>
                )}

                {scanError && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ef4444' }}>
                    {scanError}
                  </p>
                )}

                <button onClick={startScanner} className="btn btn-primary btn-md">
                  Scan Next
                </button>
              </div>
            )}
          </div>

          <aside className={styles.scannerRight}>
            <div className={styles.statsCard}>
              <h3>Live Attendance</h3>
              <div className={styles.attendanceGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>—</span>
                  <span className={styles.statLab}>Checked In</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>—</span>
                  <span className={styles.statLab}>Total Sold</span>
                </div>
              </div>
              <hr className="rule" />
              <div className={styles.recentScans}>
                <h4>Recent Scans</h4>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666' }}>
                  Live dashboard coming soon.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
