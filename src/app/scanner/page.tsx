"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './scanner.module.css';

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required for scanning tickets.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleSimulateScan = () => {
    // Simulated scan result
    setScanResult({
      status: 'valid',
      ticket_id: 'TKT-2026-X8392',
      buyer_name: 'Zia Ahmed',
      tier_name: 'General Admission',
      event_title: 'Sounds of Lyari Festival',
    });
    stopScanner();
  };

  return (
    <main className={styles.scannerPage}>
      <div className="container">
        <div className={styles.scannerLayout}>
          
          <div className={styles.scannerLeft}>
            <div className={styles.header}>
              <span className="chip chip-accent">Door Staff</span>
              <h1>Ticket Scanner</h1>
              <p>Scan visitor QR codes to verify entry.</p>
            </div>

            {!isScanning && !scanResult && (
              <div className={styles.startState}>
                <div className={styles.cameraIcon}>📷</div>
                <button onClick={startScanner} className="btn btn-primary btn-lg">
                  Open Camera
                </button>
              </div>
            )}

            {isScanning && (
              <div className={styles.cameraView}>
                <video ref={videoRef} autoPlay playsInline className={styles.video} />
                <div className={styles.overlay}>
                  <div className={styles.frame} />
                </div>
                <div className={styles.controls}>
                  <button onClick={handleSimulateScan} className="btn btn-accent btn-md">
                    Simulate Valid Scan
                  </button>
                  <button onClick={stopScanner} className="btn btn-secondary btn-md">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {scanResult && (
              <div className={`${styles.resultCard} ${scanResult.status === 'valid' ? styles.resultValid : styles.resultInvalid}`}>
                <div className={styles.resultIcon}>
                  {scanResult.status === 'valid' ? '✓' : '✗'}
                </div>
                <h2>{scanResult.status === 'valid' ? 'Access Granted' : 'Invalid Ticket'}</h2>
                
                <div className={styles.resultDetails}>
                  <div className={styles.detailRow}>
                    <span>Guest</span>
                    <strong>{scanResult.buyer_name}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Tier</span>
                    <strong>{scanResult.tier_name}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Event</span>
                    <strong>{scanResult.event_title}</strong>
                  </div>
                </div>

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
                  <span className={styles.statVal}>124</span>
                  <span className={styles.statLab}>Checked In</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>250</span>
                  <span className={styles.statLab}>Total Sold</span>
                </div>
              </div>
              <hr className="rule" />
              <div className={styles.recentScans}>
                <h4>Recent Scans</h4>
                <div className={styles.scanRow}>
                  <span>Zia Ahmed</span>
                  <span className={styles.scanTime}>2m ago</span>
                </div>
                <div className={styles.scanRow}>
                  <span>Sarah Khan</span>
                  <span className={styles.scanTime}>5m ago</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
