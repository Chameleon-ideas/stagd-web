'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ImageIcon, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import styles from './create.module.css';
import { gsap } from '@/lib/gsap';
import { useGSAP } from '@gsap/react';

const EVENT_TYPES = [
  { label: 'CONCERT', value: 'concert' },
  { label: 'WORKSHOP', value: 'workshop' },
  { label: 'GALLERY', value: 'gallery' },
  { label: 'SPOKEN WORD', value: 'spoken_word' },
  { label: 'OTHER', value: 'other' },
];

const CITIES = ['Karachi', 'Lahore', 'Islamabad'];

const STEPS = [
  { id: '01', name: 'BASICS',      title: 'TELL US WHAT.' },
  { id: '02', name: 'WHEN · WHERE', title: 'TELL US WHEN.' },
  { id: '03', name: 'TICKETS',     title: 'TELL US HOW.' },
  { id: '04', name: 'DOOR STAFF',  title: "WHO'S AT THE DOOR?" },
  { id: '05', name: 'REVIEW',      title: 'LOOK GOOD?' },
];

interface Tier {
  name: string;
  price: string;
  capacity: string;
}

function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Initial Sidebar & SidebarMeta reveal
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } });
    tl.from(`.${styles.sidebar}`, { x: -40, opacity: 0, duration: 1 })
      .from(`.${styles.stepMeta}`, { y: 10, opacity: 0 }, '-=0.6')
      .from(`.${styles.stepTitle}`, { y: 10, opacity: 0 }, '-=0.6')
      .from(`.${styles.progressItem}`, { 
        x: -10, 
        opacity: 0, 
        stagger: 0.05,
        clearProps: 'all'
      }, '-=0.4');

    gsap.from(`.${styles.mediaArea}`, { x: 40, opacity: 0, duration: 1 });
  }, { scope: containerRef });

  // Step transition animation
  useGSAP(() => {
    if (formSectionRef.current) {
      gsap.fromTo(formSectionRef.current, 
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', clearProps: 'y,opacity' }
      );
    }
  }, { dependencies: [step], scope: containerRef });
  // Pre-upload: start upload immediately on image select; resolve at publish time
  const coverUploadRef = useRef<Promise<string> | null>(null);

  // Track existing draft ID (set on save, or loaded from ?draft= param)
  const [draftId, setDraftId] = useState<string | null>(searchParams.get('draft'));

  // Step 1 — Basics
  const [eventType, setEventType] = useState('concert');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // Step 2 — When & Where
  const [startsAt, setStartsAt] = useState('');
  const [doorsAt, setDoorsAt] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState('Karachi');
  const [mapsPin, setMapsPin] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Step 3 — Tickets
  const [isFree, setIsFree] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([{ name: 'General Admission', price: '', capacity: '' }]);
  const [doorAllocation, setDoorAllocation] = useState('0');

  // Step 4 — Door Staff
  const [doorStaff, setDoorStaff] = useState<Array<{ type: 'username' | 'phone'; value: string }>>([]);
  const [doorStaffInput, setDoorStaffInput] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?next=/events/create');
    }
  }, [user, isLoading, router]);

  // Pre-fill form from draft when resuming
  useEffect(() => {
    if (!draftId || !user || isLoading) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ op: 'getDraftEventById', eventId: draftId }),
      });
      const result = await res.json();
      if (result.error || !result.event) return;
      const e = result.event;
      if (e.event_type) setEventType(e.event_type);
      if (e.title) setTitle(e.title);
      if (e.description) setDescription(e.description);
      if (e.venue_name) setVenueName(e.venue_name);
      if (e.venue_address) setVenueAddress(e.venue_address);
      if (e.city) setCity(e.city);
      if (e.maps_pin) setMapsPin(e.maps_pin);
      if (e.is_recurring) setIsRecurring(e.is_recurring);
      if (e.starts_at && new Date(e.starts_at) > new Date()) {
        const d = new Date(e.starts_at);
        setStartsAt(d.toISOString().slice(0, 16));
      }
      if (e.tiers?.length > 0) {
        setTiers(e.tiers.map((t: any) => ({ name: t.name, price: String(t.price), capacity: String(t.capacity) })));
        setIsFree(e.tiers[0]?.price === 0 && e.tiers[0]?.name === 'Free Entry');
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, user, isLoading]);

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverUploading(true);
    const path = `${user.id}/${Date.now()}.jpg`;
    coverUploadRef.current = compressImage(file)
      .then(blob => supabase.storage
        .from('events')
        .upload(path, blob, { upsert: false, contentType: 'image/jpeg' })
      )
      .then(({ error }) => {
        if (error) throw new Error(`Cover image upload failed: ${error.message}`);
        return supabase.storage.from('events').getPublicUrl(path).data.publicUrl;
      })
      .finally(() => setCoverUploading(false));
  };

  const addTier = () => {
    setTiers(prev => [...prev, { name: '', price: '', capacity: '' }]);
  };

  const removeTier = (i: number) => {
    setTiers(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateTier = (i: number, field: keyof Tier, value: string) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const canAdvance = () => {
    if (step === 1) return title.trim().length >= 2;
    if (step === 2) return !!startsAt && venueName.trim().length >= 2;
    if (step === 3) return isFree || tiers.every(t => t.name && t.capacity && parseInt(t.price) > 0);
    return true;
  };

  const handleCoverUpload = async (): Promise<string> => {
    if (!coverUploadRef.current) return '';
    // Race: wait up to 20s for the pre-upload to finish, then proceed without cover
    const timeout = new Promise<string>(resolve => setTimeout(() => resolve(''), 20_000));
    return Promise.race([coverUploadRef.current.catch(() => ''), timeout]);
  };

  const buildPayload = () => ({
    eventData: {
      title: title.trim() || 'Untitled Event',
      description: description.trim() || null,
      event_type: eventType,
      cover_image_url: '',
      venue_name: venueName.trim() || null,
      venue_address: venueAddress.trim() || null,
      city: city || null,
      maps_pin: mapsPin.trim() || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      doors_at: doorsAt && startsAt ? new Date(`${startsAt.split('T')[0]}T${doorsAt}`).toISOString() : null,
      is_recurring: isRecurring,
    },
    tiers: tiers.map(t => ({
      name: t.name || 'General Admission',
      price: parseInt(t.price) || 0,
      capacity: parseInt(t.capacity) || 0,
    })),
  });

  const saveDraft = async () => {
    if (!user) return;
    setSavingDraft(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { eventData, tiers: tierData } = buildPayload();
      const op = draftId ? 'updateDraftEvent' : 'saveDraftEvent';
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ op, eventId: draftId, eventData, tiers: tierData }),
      });
      const result = await res.json();
      if (!result.error) {
        if (!draftId) setDraftId(result.eventId);
        setDraftSaved(true);
        setTimeout(() => {
          router.push(`/profile/${user.username}`);
        }, 600);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const publish = async () => {
    if (!user) return;
    setPublishing(true);
    setError(null);

    try {
      const coverImageUrl = await handleCoverUpload();
      const { tiers: rawTiers } = buildPayload();
      const tierData = isFree
        ? [{ name: 'Free Entry', price: 0, capacity: parseInt(tiers[0]?.capacity || '100') }]
        : rawTiers;

      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        cover_image_url: coverImageUrl,
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim() || null,
        city,
        maps_pin: mapsPin.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        doors_at: doorsAt ? new Date(`${startsAt.split('T')[0]}T${doorsAt}`).toISOString() : null,
        is_recurring: isRecurring,
      };

      const { data: { session } } = await supabase.auth.getSession();
      const op = draftId ? 'publishDraftEvent' : 'createEvent';
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch('/api/db', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ op, eventId: draftId, eventData, tiers: tierData, doorStaff }),
      }).finally(() => clearTimeout(tid));

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      router.push(`/events/${result.eventSlug ?? result.eventId}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to publish. Please try again.');
      setPublishing(false);
    }
  };

  if (isLoading || !user) return null;

  const lowestPrice = tiers.reduce((min, t) => {
    const p = parseInt(t.price) || 0;
    return p < min ? p : min;
  }, Infinity);

  return (
    <div className={styles.page} ref={containerRef}>
      {/* Column 1: Sidebar (Meta & Actions) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarMeta}>
          <div className={styles.stepMeta}>// PHASE {STEPS[step - 1].id}</div>
          <h1 className={styles.stepTitle}>{STEPS[step - 1].title}</h1>
        </div>

        <nav className={styles.progressList}>
          {STEPS.map((s, idx) => (
            <div 
              key={s.id} 
              className={`${styles.progressItem} ${step === idx + 1 ? styles.progressItemActive : ''}`}
            >
              <div className={styles.progressItemDot} />
              <span>{s.id} {s.name}</span>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarActions}>
          <p className={styles.helpText}>
            ALL PARAMETERS ARE STORED LOCALLY. FINAL AUTHORIZATION IS REQUIRED FOR GLOBAL PUBLICATION.
          </p>
        </div>
      </aside>

      {/* Column 2: Form Area (Inputs) */}
      <section className={styles.formArea}>
        <div className={styles.contentBox}>
          <div className={styles.formHeader}>
            <button onClick={saveDraft} className={styles.saveDraftBtn} disabled={savingDraft || !title.trim()}>
              {draftSaved ? '✓ SAVED' : savingDraft ? 'SAVING…' : 'SAVE AS DRAFT'}
            </button>
          </div>

          <div className={styles.formSection} ref={formSectionRef}>
            {/* ── STEP 1: BASICS ── */}
            {step === 1 && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>// SELECT CATEGORY *</label>
                  <div className={styles.typeGrid}>
                    {EVENT_TYPES.map(t => (
                      <button
                        key={t.value}
                        className={`${styles.typeCard} ${eventType === t.value ? styles.typeActive : ''}`}
                        onClick={() => setEventType(t.value)}
                        type="button"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// EVENT TITLE *</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter event title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// DESCRIPTION</label>
                  <textarea
                    className={styles.textArea}
                    placeholder="Tell people what to expect. Lineup, dress code, anything you want."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* ── STEP 2: WHEN & WHERE ── */}
            {step === 2 && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>// EVENT SCHEDULE *</label>
                  <div className={styles.dateTimeGrid}>
                    <div className={styles.inputControlGroup}>
                      <Calendar size={16} className={styles.inputIcon} />
                      <input
                        type="date"
                        className={styles.dateTimeInput}
                        value={startsAt.split('T')[0]}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        onChange={e => {
                          const time = startsAt.split('T')[1] || '19:00';
                          setStartsAt(`${e.target.value}T${time}`);
                        }}
                      />
                      <span className={styles.inputLabel}>SELECT DATE</span>
                    </div>

                    <div className={styles.inputControlGroup}>
                      <Clock size={16} className={styles.inputIcon} />
                      <input
                        type="time"
                        className={styles.dateTimeInput}
                        value={startsAt.split('T')[1]?.slice(0, 5)}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        onChange={e => {
                          const date = startsAt.split('T')[0] || new Date().toISOString().split('T')[0];
                          setStartsAt(`${date}T${e.target.value}`);
                        }}
                      />
                      <span className={styles.inputLabel}>START TIME</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// DOORS OPEN</label>
                  <div className={styles.inputControlGroup}>
                    <Clock size={16} className={styles.inputIcon} />
                    <input
                      type="time"
                      className={styles.dateTimeInput}
                      value={doorsAt}
                      onClick={(e) => (e.target as any).showPicker?.()}
                      onChange={e => setDoorsAt(e.target.value)}
                    />
                    <span className={styles.inputLabel}>ENTRY TIME</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// VENUE NAME *</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. The Second Floor (T2F)"
                    value={venueName}
                    onChange={e => setVenueName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// SELECT CITY *</label>
                  <div className={styles.typeGrid}>
                    {CITIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.typeCard} ${city === c ? styles.typeActive : ''}`}
                        onClick={() => setCity(c)}
                      >
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// GOOGLE MAPS URL</label>
                  <input
                    type="url"
                    className={styles.textInput}
                    placeholder="https://maps.google.com/..."
                    value={mapsPin}
                    onChange={e => setMapsPin(e.target.value)}
                  />
                </div>

                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleTitle}>RECURRING EVENT</span>
                    <p className={styles.helpText}>Prompt to clone after this event concludes.</p>
                  </div>
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setIsRecurring(v => !v)}
                    style={{ background: isRecurring ? 'var(--color-yellow)' : undefined }}
                  >
                    <div className={styles.toggleThumb} style={isRecurring ? { left: 'calc(100% - 28px)' } : {}} />
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: TICKETS ── */}
            {step === 3 && (
              <>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.toggleTitle}>FREE ADMISSION</span>
                    <p className={styles.helpText}>No payment required. Digital passes will still be issued.</p>
                  </div>
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setIsFree(v => !v)}
                    style={{ background: isFree ? 'var(--color-yellow)' : undefined }}
                  >
                    <div className={styles.toggleThumb} style={isFree ? { left: 'calc(100% - 28px)' } : {}} />
                  </button>
                </div>

                {!isFree && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>// TICKET TIERS</label>
                    {tiers.map((tier, i) => (
                      <div key={i} className={styles.tierCard}>
                        <div className={styles.tierHeader}>
                          <span className={styles.tierLabel}>// TIER {String(i + 1).padStart(2, '0')}</span>
                          {tiers.length > 1 && (
                            <button type="button" className={styles.removeBtn} onClick={() => removeTier(i)}>✕</button>
                          )}
                        </div>
                        <input
                          type="text"
                          className={styles.tierNameInput}
                          placeholder="e.g. GENERAL ADMISSION"
                          value={tier.name}
                          onChange={e => updateTier(i, 'name', e.target.value)}
                        />
                        <div className={styles.tierInputs}>
                          <div className={styles.tierInputGroup}>
                            <label>// PRICE (PKR)</label>
                            <input
                              type="number"
                              min="0"
                              value={tier.price}
                              onChange={e => updateTier(i, 'price', e.target.value)}
                              placeholder="2000"
                            />
                          </div>
                          <div className={styles.tierInputGroup}>
                            <label>// CAPACITY</label>
                            <input
                              type="number"
                              min="1"
                              value={tier.capacity}
                              onChange={e => updateTier(i, 'capacity', e.target.value)}
                              placeholder="100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className={styles.addTierBtn} onClick={addTier}>+ ADD TICKET TIER</button>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>// DOOR SALES ALLOCATION</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.textInput}
                    value={doorAllocation}
                    onChange={e => setDoorAllocation(e.target.value)}
                    style={{ fontSize: '48px', fontFamily: 'var(--font-display)', textAlign: 'center' }}
                  />
                  <p className={styles.helpText} style={{ textAlign: 'center' }}>WALK-IN TICKETS RESERVED FOR NIGHT-OF SALES</p>
                </div>
              </>
            )}

            {/* ── STEP 4: DOOR STAFF ── */}
            {step === 4 && (
              <>
                <div className={styles.infoBox}>
                  // HOW IT WORKS — ASSIGNED STAFF RECEIVE A NOTIFICATION AT DOOR OPEN TIME.<br />
                  // STAGD USERNAMES GET A PUSH NOTIFICATION WITH AN IN-APP SCANNER.<br />
                  // PHONE NUMBERS GET AN SMS WITH A ONE-TIME SCANNER LINK.<br />
                  // ONLY ASSIGNED STAFF CAN VALIDATE TICKETS FOR THIS EVENT.
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>// ADD DOOR STAFF</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="@username or +92 300 1234567"
                      value={doorStaffInput}
                      onChange={e => setDoorStaffInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = doorStaffInput.trim();
                          if (!val) return;
                          const isPhone = /^[+\d]/.test(val);
                          setDoorStaff(prev => [...prev, { type: isPhone ? 'phone' : 'username', value: val }]);
                          setDoorStaffInput('');
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className={styles.primaryAction}
                      style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const val = doorStaffInput.trim();
                        if (!val) return;
                        const isPhone = /^[+\d]/.test(val);
                        setDoorStaff(prev => [...prev, { type: isPhone ? 'phone' : 'username', value: val }]);
                        setDoorStaffInput('');
                      }}
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {doorStaff.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>// ASSIGNED — {doorStaff.length} STAFF</label>
                    <div className={styles.staffList}>
                      {doorStaff.map((s, i) => (
                        <div key={i} className={styles.staffItem}>
                          <div className={styles.staffInfo}>
                            <div className={styles.staffValue}>{s.value}</div>
                            <div className={styles.staffType}>
                              {s.type === 'username' ? 'PUSH NOTIFICATION' : 'SMS SCANNER LINK'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.staffRemove}
                            onClick={() => setDoorStaff(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doorStaff.length === 0 && (
                  <div className={styles.emptyStaff}>
                    NO STAFF ASSIGNED YET.<br />
                    <span style={{ color: 'var(--text-faint)', opacity: 0.6 }}>YOU CAN SKIP THIS AND ADD STAFF LATER.</span>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 5: REVIEW ── */}
            {step === 5 && (
              <div style={{ border: '1.5px solid var(--border-color)', background: 'var(--bg-surface)', height: '100%' }}>
                <div style={{ padding: '40px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '32px', marginBottom: '32px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-faint)', marginBottom: '8px' }}>// SCHEDULED DATE</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>
                        {startsAt ? new Date(startsAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase() : 'DATE NOT SET'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-yellow)', marginTop: '4px' }}>
                        {startsAt ? new Date(startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '00:00'} HRS
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-faint)', marginBottom: '8px' }}>// VENUE IDENTIFIER</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>
                        {venueName.toUpperCase() || 'SPECIFY VENUE'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>
                        {city.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1.5px solid var(--border-color)', paddingBottom: '32px', marginBottom: '32px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-faint)', marginBottom: '12px' }}>// DOOR STAFF</div>
                    {doorStaff.length === 0 ? (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)' }}>NONE ASSIGNED</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {doorStaff.map((s, i) => (
                          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-raised)', border: '1px solid var(--border-color)', padding: '6px 12px' }}>
                            {s.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint)' }}>// GATE PASS</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--color-yellow)' }}>
                      {isFree ? 'COMPLIMENTARY' : lowestPrice < Infinity && lowestPrice > 0 ? `PKR ${lowestPrice.toLocaleString()}+` : 'FREE ENTRY'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className={styles.secondaryAction}>
                BACK
              </button>
            ) : <div />}

            <button
              onClick={step < 5 ? () => setStep(s => s + 1) : publish}
              className={styles.primaryAction}
              disabled={!canAdvance() || publishing}
            >
              {step === 5 ? (publishing ? 'PUBLISHING...' : 'PUBLISH EVENT') : 'CONTINUE'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '20px', background: 'rgba(230,57,70,0.1)', borderLeft: '2px solid #E63946', padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#E63946', textTransform: 'uppercase' }}>
              ERROR: {error}
            </div>
          )}
        </div>
      </section>

      {/* Column 3: Media & Asset Pane */}
      <aside className={styles.mediaArea}>
        <div className={styles.formGroup}>
          <label className={styles.label}>// VISUAL ASSET</label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverChange}
          />
          <div
            className={styles.uploadBox}
            onClick={() => coverInputRef.current?.click()}
            style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : {}}
          >
            {!coverPreview && (
              <>
                <ImageIcon size={32} strokeWidth={1} />
                <span>ATTACH COVER IMAGE</span>
              </>
            )}
          </div>
          {coverUploading && (
            <p className={styles.helpText} style={{ color: 'var(--color-yellow)' }}>
              ↑ UPLOADING COVER IMAGE...
            </p>
          )}
          {!coverUploading && (
            <p className={styles.helpText}>
              PORTRAIT (4:5) ORIENTATION RECOMMENDED. THIS WILL BE THE PRIMARY IDENTITY OF THE EVENT.
            </p>
          )}
        </div>

        {step === 5 && (
          <div style={{ marginTop: 'auto', borderTop: '1.5px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', marginBottom: '12px' }}>
              // AUTHENTICATION LOG
            </div>
            <p className={styles.helpText}>
              READY FOR PUBLICATION. VERIFY ALL PARAMETERS BEFORE COMMITTING.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function CreateEventPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CreateEventPage />
    </Suspense>
  );
}
