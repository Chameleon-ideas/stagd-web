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
import { HeroMarquee } from '@/components/home/HeroMarquee';

export default async function HomePage() {
  const eventsData = await searchEvents({ per_page: 5 });
  const realEvents = eventsData.data;

  return (
    <EditorialLayout>
      <main id="main-content" className={styles.gridBackground}>

        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={`container ${styles.heroLayout}`}>


            <div className={styles.heroContent}>
              <div className={styles.heroHeader}>
                <div className={styles.heroTopMeta}>
                  <span className={styles.liveBadge}>KHI · NOW LIVE</span>
                  <span className={styles.volText}>VOL 01</span>
                </div>
                <h1 id="hero-heading" className={styles.heroHeading}>
                  FIND.<br />
                  <span className={styles.heroAccent}>HIRE</span>.<br />
                  SHOW UP.
                </h1>
              </div>

              <p className={styles.heroBody}>
                Pakistan's first platform for the creative class and everyone who believes in it.
              </p>

              <div className={styles.heroActions}>
                <Link href="/explore" className="btn btn-accent btn-lg" id="hero-browse">
                  Explore Registry →
                </Link>
                <div className={styles.heroStoreLinks}>
                  <a href={APP_STORE_URL} className={styles.miniStoreLink} target="_blank" rel="noopener noreferrer">
                    <Image src="/stores/appstore-light.svg" alt="App Store" width={100} height={30} className={styles.lightLogo} />
                    <Image src="/stores/appstore-dark.svg" alt="App Store" width={100} height={30} className={styles.darkLogo} />
                  </a>
                  <a href={PLAY_STORE_URL} className={styles.miniStoreLink} target="_blank" rel="noopener noreferrer">
                    <Image src="/stores/playstore-light.svg" alt="Play Store" width={100} height={30} className={styles.lightLogo} />
                    <Image src="/stores/playstore-dark.svg" alt="Play Store" width={100} height={30} className={styles.darkLogo} />
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <HeroMarquee />
            </div>

          </div>
        </section>

        {/* ─── CLAIM YOUR PROFILE ───────────────────────────── */}
        <section className={styles.claim}>
          <div className="container">
            <div className={styles.claimInner}>
              <div className={styles.claimLeft}>
                <span className={styles.sectionMeta}>// CREATOR INITIATIVE</span>
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
              <span className={styles.sectionMeta}>// THE INFRASTRUCTURE</span>
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
        <section className={`${styles.organisers} stripe-dark`} data-theme="dark" aria-labelledby="org-heading">
          <div className="container">
            <div className={styles.organisersInner}>
              <div className={styles.organisersLeft}>
                <span className={styles.sectionMeta}>// ORGANISER TOOLS</span>
                <h2 id="org-heading" className={styles.orgHeading}>
                  Sell tickets<br />before the night.
                </h2>
                <p className={styles.orgBody}>
                  Create your event. Set ticket tiers. Share the poster. Stagd generates QR codes, runs Safepay checkout, and gives your door staff a phone scanner — no app download required.
                </p>
                <a href={APP_STORE_URL} className="btn btn-secondary btn-md" target="_blank" rel="noopener noreferrer" id="org-cta">
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
            <div className={styles.finalCtaInner}>
              <h2 id="final-heading" className={styles.finalHeading}>
                READY TO LEVEL UP?
              </h2>
              <a href={APP_STORE_URL} className="btn btn-contrast-green btn-lg" target="_blank" rel="noopener noreferrer">
                Join the community
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
