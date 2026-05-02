import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/utils';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Stagd — Pakistan's Creative Economy",
  description:
    'Find artists, book tickets, commission work. Stagd is where Karachi\'s independent creative scene shows up.',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">

        {/* ─── HERO ──────────────────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={`container ${styles.heroInner}`}>

            <div className={styles.heroLeft}>
              <div className={styles.heroLabel}>
                <span className={`chip chip-yellow ${styles.nowLive}`}>KHI · Now live</span>
                <span className={styles.heroMeta}>Vol 01</span>
              </div>

              <h1 id="hero-heading" className={styles.heroHeading}>
                Five nights<br />
                <span className={styles.heroAccent}>worth</span><br />
                showing up for.
              </h1>

              <p className={styles.heroBody}>
                Portfolios, commissions, and ticketing for independent artists in Pakistan — and the people who show up for them.
              </p>

              <div className={styles.heroCtas}>
                <a href={APP_STORE_URL} className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer" id="hero-ios">
                  App Store
                </a>
                <a href={PLAY_STORE_URL} className="btn btn-secondary btn-lg" target="_blank" rel="noopener noreferrer" id="hero-android">
                  Play Store
                </a>
              </div>
              <Link href="/explore" className={styles.heroExplore} id="hero-browse">
                Browse artists →
              </Link>
            </div>

            {/* Newsstand grid — 3 event card previews */}
            <div className={styles.heroRight} aria-hidden="true">
              <div className={styles.newsstand}>
                {DEMO_EVENTS.map((ev, i) => (
                  <div
                    key={i}
                    className={`${styles.nsCard} ${i === 0 ? styles.nsCardFeatured : ''}`}
                    style={{ '--card-bg': ev.color } as React.CSSProperties}
                  >
                    <div className={styles.nsCardInner}>
                      <div className={styles.nsTop}>
                        <span className={`chip chip-yellow`}>{ev.type}</span>
                        <span className={styles.nsNum}>{ev.num}</span>
                      </div>
                      <div className={styles.nsBottom}>
                        <p className={styles.nsMeta}>{ev.meta}</p>
                        <p className={styles.nsTitle}>{ev.title}</p>
                        <p className={styles.nsDate}>{ev.date}</p>
                      </div>
                    </div>
                    {/* Diagonal stripe texture */}
                    <div className={`${styles.nsStripe} stripe-light`} />
                  </div>
                ))}
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
                <div className={styles.eventTypes}>
                  {EVENT_TYPE_LIST.map(t => (
                    <div
                      key={t.label}
                      className={`chip ${t.chipClass} ${styles.eventTypeChip}`}
                    >
                      {t.label}
                    </div>
                  ))}
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
              <a href={APP_STORE_URL} className="btn btn-primary btn-xl" target="_blank" rel="noopener noreferrer" id="final-ios">
                Download on App Store
              </a>
              <a href={PLAY_STORE_URL} className="btn btn-secondary btn-xl" target="_blank" rel="noopener noreferrer" id="final-android">
                Get it on Play Store
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

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
