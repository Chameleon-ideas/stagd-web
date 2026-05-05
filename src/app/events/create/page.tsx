'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './create.module.css';

const STEPS = [
  { id: '01', name: 'BASICS', title: 'TELL US WHAT.' },
  { id: '02', name: 'WHEN & WHERE', title: 'TELL US WHEN.' },
  { id: '03', name: 'TICKETS', title: 'TELL US HOW.' },
  { id: '04', name: 'DOOR STAFF', title: "WHO'S AT THE DOOR?" },
  { id: '05', name: 'REVIEW', title: 'LOOK GOOD?' },
];

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className="container">
          <div className={styles.topBarInner}>
            <button onClick={() => router.back()} className={styles.cancelBtn}>CANCEL</button>
            <div className={styles.logo}>STAGD</div>
            <button className={styles.saveBtn}>SAVE DRAFT</button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className="container">
          <div className={styles.progressBar}>
            {[1, 2, 3, 4, 5].map(step => (
              <div 
                key={step} 
                className={`${styles.progressSegment} ${step <= currentStep ? styles.segmentActive : ''}`} 
              />
            ))}
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.contentBox}>
            
            <div className={styles.stepMeta}>
              // STEP {STEPS[currentStep - 1].id} / 05 · {STEPS[currentStep - 1].name}
            </div>
            
            <h1 className={styles.stepTitle}>{STEPS[currentStep - 1].title}</h1>

            {/* STEP 01: BASICS */}
            {currentStep === 1 && (
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>// EVENT TYPE *</label>
                  <div className={styles.typeGrid}>
                    {['CONCERT', 'WORKSHOP', 'GALLERY', 'SPOKEN WORD', 'OTHER'].map(type => (
                      <button key={type} className={`${styles.typeCard} ${type === 'CONCERT' ? styles.typeActive : ''}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// TITLE *</label>
                  <input type="text" placeholder="Lyari Underground 04" className={styles.textInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// DESCRIPTION</label>
                  <textarea 
                    placeholder="Five sets, two rooms, hosted by Daniyal & friends. Doors open early — get there before 9." 
                    className={styles.textArea}
                  />
                  <p className={styles.helpText}>Tell people what to expect. Lineup, dress code, anything you want.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// COVER IMAGE</label>
                  <div className={styles.uploadBox}>
                    <div className={styles.uploadIcon}>🖼️</div>
                    <span>// TAP TO UPLOAD</span>
                  </div>
                  <p className={styles.helpText}>Tap to upload. 4:5 portrait works best for the home feed.</p>
                </div>
              </div>
            )}

            {/* STEP 02: WHEN & WHERE */}
            {currentStep === 2 && (
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>// DATE & TIME *</label>
                  <input type="text" placeholder="Sat 17 May · 9:00 PM" className={styles.textInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// VENUE NAME *</label>
                  <input type="text" placeholder="The Second Floor (T2F)" className={styles.textInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// CITY *</label>
                  <div className={styles.typeGrid}>
                    {['KARACHI', 'LAHORE', 'ISLAMABAD'].map(city => (
                      <button key={city} className={`${styles.typeCard} ${city === 'KARACHI' ? styles.typeActive : ''}`}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// MAPS PIN</label>
                  <input type="text" placeholder="https://maps.google.com/..." className={styles.textInput} />
                  <p className={styles.helpText}>Paste a Google Maps link — we'll embed it on the event page.</p>
                </div>
              </div>
            )}

            {/* STEP 03: TICKETS */}
            {currentStep === 3 && (
              <div className={styles.formSection}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleTitle}>Free event</span>
                    <p className={styles.helpText}>Skip payment. Buyers tap 'Reserve a spot' and still get a QR.</p>
                  </div>
                  <div className={styles.toggle}>
                    <div className={styles.toggleThumb} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// TICKET TIERS</label>
                  <div className={styles.tierCard}>
                    <div className={styles.tierHeader}>
                      <span>// TIER 01</span>
                      <button className={styles.removeBtn}>✕</button>
                    </div>
                    <h2 className={styles.tierName}>GENERAL ADMISSION</h2>
                    <div className={styles.tierInputs}>
                      <div className={styles.tierInputGroup}>
                        <label>PKR</label>
                        <input type="text" defaultValue="2000" />
                      </div>
                      <div className={styles.tierInputGroup}>
                        <label>Capacity</label>
                        <input type="text" defaultValue="120" />
                      </div>
                    </div>
                  </div>
                  <button className={styles.addTierBtn}>+ ADD TIER</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <div className={styles.bottomNav}>
        <div className="container">
          <div className={styles.bottomNavInner}>
            {currentStep > 1 && (
              <button onClick={prevStep} className={styles.backBtn}>← BACK</button>
            )}
            <button 
              onClick={nextStep} 
              className={styles.continueBtn}
            >
              {currentStep === 5 ? 'PUBLISH EVENT →' : 'CONTINUE →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
