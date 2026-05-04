import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/utils';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Stagd — Pakistan's Creative Economy",
  description:
    'Find artists, book tickets, commission work. Stagd is where Karachi\'s independent creative scene shows up.',
};

import { searchEvents } from '@/lib/api';
import { EditorialLayout } from '@/components/layout/EditorialLayout';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const eventsData = await searchEvents({ per_page: 5 });
  const realEvents = eventsData.data;

  return (
    <EditorialLayout>
      <main id="main-content" className={styles.gridBackground}>

        {/* ─── HERO ──────────────────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={`container ${styles.heroInner}`}>

            <div className={styles.heroLeft}>
              <div className={styles.heroLabel}>
                <span className={`chip chip-yellow ${styles.nowLive}`}>KHI · Now live</span>
                <span className={styles.heroMeta}>Vol 01</span>
              </div>

              <h1 id="hero-heading" className={styles.heroHeading}>
                FIND<span className={styles.yellowDot}>.</span><br />
                <span className={styles.heroAccent}>HIRE<span className={styles.yellowDot}>.</span></span><br />
                SHOW UP<span className={styles.yellowDot}>.</span>
              </h1>

              <p className={styles.heroBody}>
                Pakistan's first platform for the creative class and everyone who believes in it.
              </p>

              <div className={styles.heroCtas}>
                <a href={APP_STORE_URL} className={styles.storeLink} target="_blank" rel="noopener noreferrer" id="hero-ios">
                  <Image src="/stores/appstore-light.svg" alt="Download on App Store" width={135} height={40} className={styles.lightLogo} />
                  <Image src="/stores/appstore-dark.svg" alt="Download on App Store" width={135} height={40} className={styles.darkLogo} />
                </a>
                <a href={PLAY_STORE_URL} className={styles.storeLink} target="_blank" rel="noopener noreferrer" id="hero-android">
                  <Image src="/stores/playstore-light.svg" alt="Get it on Google Play" width={135} height={40} className={styles.lightLogo} />
                  <Image src="/stores/playstore-dark.svg" alt="Get it on Google Play" width={135} height={40} className={styles.darkLogo} />
                </a>
              </div>
              <Link href="/explore" className={styles.heroExplore} id="hero-browse">
                Browse artists →
              </Link>
            </div>

            {/* Platform Collage — Discovery + Commissions + Events */}
            <div className={styles.heroRight} aria-hidden="true">
              <div className={styles.collage}>
                {/* Artist Peek */}
                <div className={`${styles.collageCard} ${styles.artistPeek}`}>
                  <Image src="/images/zoya_portrait.png" alt="Zoya Khan" fill style={{ objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: '#fff' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase' }}>Discovery</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>Zoya Khan</p>
                  </div>
                </div>

                {/* Event Peek */}
                <div className={`${styles.collageCard} ${styles.eventPeek}`}>
                  <Image src="/images/osman_project.png" alt="Event" fill style={{ objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="chip chip-yellow" style={{ fontSize: '9px' }}>Event</span>
                  </div>
                </div>

                {/* Commission Peek */}
                <div className={`${styles.collageCard} ${styles.commPeek}`}>
                  <span className={styles.commLabel}>Commissions</span>
                  <p className={styles.commTitle}>Modern Qalam Mural</p>
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>In progress</span>
                    <div style={{ width: '8px', height: '8px', background: 'var(--color-yellow)', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── CLAIM YOUR PROFILE ───────────────────────────── */}
        <section className={styles.claim}>
          <div className="container">
            <div className={styles.claimInner}>
              <div className={styles.claimLeft}>
                <span className="section-label text-tag text-muted">For creatives</span>
                <h2 className={styles.claimHeading}>
                  Your work.<br />Your URL.<br />
                  <span className={styles.claimUrl}>stagd.app/yourname</span>
                </h2>
              </div>
              <div className={styles.claimRight}>
                <p className={styles.claimBody}>
                  One link. Your full portfolio, upcoming gigs, rates, and a direct line for commissions. No platform branding. No subscription fees in v1.
                </p>
                <a href={APP_STORE_URL} className="btn btn-accent btn-md" target="_blank" rel="noopener noreferrer" id="claim-cta">
                  Claim your profile
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── THREE PILLARS — alternating rows ─────────────── */}
        <section className={styles.pillars} aria-labelledby="pillars-heading">
          <div className="container">
            <div className={styles.pillarsHeader}>
              <span className="text-tag font-mono text-muted" style={{ letterSpacing: 'var(--tracking-tag)', textTransform: 'uppercase' }}>What Stagd does</span>
              <h2 id="pillars-heading" className={styles.pillarsHeading}>Three things.<br />Done properly.</h2>
            </div>

            <hr className="rule" />

            {/* 01 — Discovery */}
            <div className={styles.pillar}>
              <div className={styles.pillarLeft}>
                <span className={styles.pillarNum}>01</span>
                <h3 className={styles.pillarTitle}>Discovery</h3>
                <p className={styles.pillarBody}>
                  Every creative on Stagd gets a proper portfolio page at their own URL. A masonry grid of their work, their rates, availability, and a direct way to hire them. Burns Road after dark is a different city — Stagd makes sure you know who's in it.
                </p>
                <Link href="/explore" className="btn btn-secondary btn-md" id="pillar-discover">
                  Browse artists
                </Link>
              </div>
              <div className={styles.pillarRight}>
                <div className={styles.pillarStats}>
                  {STATS.map(s => (
                    <div key={s.label} className={styles.statRow}>
                      <span className={styles.statValue}>{s.value}</span>
                      <span className={styles.statLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="rule" />

            {/* 02 — Commissions */}
            <div className={`${styles.pillar} ${styles.pillarFlip}`}>
              <div className={styles.pillarRight}>
                <div className={styles.flowList}>
                  {FLOW_STEPS.map((step, i) => (
                    <div key={step} className={styles.flowRow}>
                      <span className={styles.flowNum}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.flowStep}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.pillarLeft}>
                <span className={styles.pillarNum}>02</span>
                <h3 className={styles.pillarTitle}>Commissions</h3>
                <p className={styles.pillarBody}>
                  Brief, proposal, deposit, delivery — all tracked inside the app. No chasing DMs. No losing context in WhatsApp threads. Risograph printing, explained properly. Small class. You'll leave with a print.
                </p>
                <a href={APP_STORE_URL} className="btn btn-secondary btn-md" target="_blank" rel="noopener noreferrer" id="pillar-commission">
                  Start a commission
                </a>
              </div>
            </div>

            <hr className="rule" />

            {/* 03 — Events */}
            <div className={styles.pillar}>
              <div className={styles.pillarLeft}>
                <span className={styles.pillarNum}>03</span>
                <h3 className={styles.pillarTitle}>Events &amp; Tickets</h3>
                <p className={styles.pillarBody}>
                  Creatives run nights. Stagd handles the ticketing — tiers, QR codes, door scanning, payouts. No third-party forms. No cash at the door. T2F Garden has housed the underground since before underground was a word people used.
                </p>
                <Link href="/explore?tab=events" className="btn btn-secondary btn-md" id="pillar-events">
                  See what's on
                </Link>
              </div>
              <div className={styles.pillarRight}>
                <div className={styles.eventShowcase}>
                  {realEvents.map((item) => {
                    const ev = item.event;

                    // Helper to map event types to design system chips
                    const getChipClass = (type: string) => {
                      const t = type.toLowerCase();
                      if (t.includes('concert') || t.includes('gig')) return 'chip-concert';
                      if (t.includes('workshop') || t.includes('class')) return 'chip-workshop';
                      if (t.includes('gallery') || t.includes('exhibition')) return 'chip-exhibition';
                      if (t.includes('market')) return 'chip-market';
                      if (t.includes('talk') || t.includes('poetry')) return 'chip-talk';
                      if (t.includes('film')) return 'chip-film';
                      if (t.includes('dance')) return 'chip-dance';
                      return 'chip-ink'; // Default
                    };

                    return (
                      <Link key={ev.id} href={`/events/${ev.id}`} className={styles.eventShowcaseCard}>
                        <div className={styles.eventShowcaseCover}>
                          <Image
                            src={ev.cover_image_url || '/images/default-event.png'}
                            alt={ev.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            className={styles.eventShowcaseImage}
                          />
                          <div className={styles.eventShowcaseTop}>
                            <span className={`chip ${getChipClass(ev.event_type)}`}>{ev.event_type}</span>
                          </div>
                          <div className={styles.eventShowcaseBottom}>
                            <span className={styles.eventShowcaseMeta}>{formatDate(ev.starts_at)}</span>
                            <h4 className={styles.eventShowcaseTitle}>{ev.title}</h4>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOR ORGANISERS — full-width stripe ───────────── */}
        <section className={`${styles.organisers} stripe-dark`} aria-labelledby="org-heading">
          <div className="container">
            <div className={styles.organisersInner}>
              <div className={styles.organisersLeft}>
                <span className="text-tag font-mono text-muted" style={{ letterSpacing: 'var(--tracking-tag)', textTransform: 'uppercase' }}>For organisers</span>
                <h2 id="org-heading" className={styles.orgHeading}>
                  Sell tickets<br />before the night.
                </h2>
                <p className={styles.orgBody}>
                  Create your event. Set ticket tiers. Share the poster. Stagd generates QR codes, runs Safepay checkout, and gives your door staff a phone scanner — no app download required.
                </p>
                <a href={APP_STORE_URL} className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer" id="org-cta">
                  Set up your first event
                </a>
              </div>
              <div className={styles.organisersRight}>
                {ORG_FEATURES.map(f => (
                  <div key={f} className={styles.orgFeature}>
                    <span className={styles.orgCheck}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ────────────────────────────────────── */}
        <section className={styles.finalCta} aria-labelledby="final-heading">
          <div className="container">
            <h2 id="final-heading" className={styles.finalHeading}>
              Build something<br />worth discovering.
            </h2>
            <p className={styles.finalBody}>
              Stagd is where Pakistan's independent creative scene shows up. Download the app and claim your space.
            </p>
            <div className={styles.finalBtns}>
              <a href={APP_STORE_URL} className={styles.storeLink} target="_blank" rel="noopener noreferrer" id="final-ios">
                <Image src="/stores/appstore-light.svg" alt="Download on App Store" width={150} height={44} className={styles.lightLogo} />
                <Image src="/stores/appstore-dark.svg" alt="Download on App Store" width={150} height={44} className={styles.darkLogo} />
              </a>
              <a href={PLAY_STORE_URL} className={styles.storeLink} target="_blank" rel="noopener noreferrer" id="final-android">
                <Image src="/stores/playstore-light.svg" alt="Get it on Play Store" width={150} height={44} className={styles.lightLogo} />
                <Image src="/stores/playstore-dark.svg" alt="Get it on Play Store" width={150} height={44} className={styles.darkLogo} />
              </a>
            </div>
          </div>
        </section>

      </main>
    </EditorialLayout>
  );
}

/* ── Static demo data ─────────────────────────────────────── */

/* ── Static demo data ─────────────────────────────────────── */

const DEMO_EVENTS = [
  {
    title: 'SOUNDS\nOF LYARI',
    type: 'CONCERT',
    meta: 'NO. 01 · MUSIC',
    date: 'SAT 2 MAY · 8 PM · T2F',
    num: '01 / 05',
    color: '#E63946',
  },
  {
    title: 'OPEN\nSTUDIO',
    type: 'WORKSHOP',
    meta: 'NO. 02 · CLASS',
    date: 'TUE 5 MAY · OKA',
    num: '02 / 05',
    color: '#1CAEE5',
  },
  {
    title: 'FOLD\nFOLIO',
    type: 'MARKET',
    meta: 'NO. 05 · MARKET',
    date: 'SAT 9 MAY · HINDU GYM',
    num: '05 / 05',
    color: '#FFDE0D',
  },
];

const STATS = [
  { value: '350+', label: 'Creatives on Stagd' },
  { value: '12+', label: 'Disciplines' },
  { value: '3', label: 'Cities' },
];

const FLOW_STEPS = ['Brief', 'Proposal', 'Deposit', 'Delivery'];

const EVENT_TYPE_LIST = [
  { label: 'CONCERT', chipClass: 'chip-concert' },
  { label: 'WORKSHOP', chipClass: 'chip-workshop' },
  { label: 'GALLERY', chipClass: 'chip-gallery' },
  { label: 'MARKET', chipClass: 'chip-market' },
  { label: 'POETRY', chipClass: 'chip-poetry' },
  { label: 'DANCE', chipClass: 'chip-dance' },
];

const ORG_FEATURES = [
  'Multiple ticket tiers, custom pricing',
  'Dynamic QR codes — single use, server-invalidated',
  'Safepay checkout with organiser payouts',
  'Door scanner works in any phone browser',
  'Real-time attendance tracking',
];
