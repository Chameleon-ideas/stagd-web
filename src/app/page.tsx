import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { searchEvents, searchArtists, getCreativeCount } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { GSAPEntrance, GSAPHeroReveal, GSAPLineReveal } from '@/components/animations/GSAPEntrance';
import { InteractiveCardDeck } from '@/components/home/InteractiveCardDeck';
import { StagdLogo } from '@/components/layout/StagdLogo';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "Stag'd — Pakistan's Creative Economy",
  description:
    "Pakistan's creative class. Discovered, hired, experienced.",
};

export default async function HomePage() {
  const [eventsData, artistsData, creativeCount] = await Promise.all([
    searchEvents({ per_page: 8 }),
    searchArtists({ per_page: 24 }),
    getCreativeCount(),
  ]);

  const liveEvents = eventsData.data;
  const allArtists = artistsData.data;
  const featuredArtists = allArtists.filter(({ user }) => !!user.avatar_url);
  const showFeatured = featuredArtists.length > 0;

  return (
    <div className={styles.page}>
      <InteractiveCardDeck>

        {/* ════════════════════════════════════════════════════
            CARD 01 · STYLISH HERO + TICKER
            ════════════════════════════════════════════════════ */}
        <div style={{ width: '100%' }}>
          <GSAPHeroReveal selector="[data-reveal]" stagger={0.12} delay={0.1} y={24} duration={0.7}>
            <section className={styles.hero} aria-labelledby="hero-heading">
              <div className={styles.heroGrain} aria-hidden="true" />

              <div className={styles.heroBgImageWrap} aria-hidden="true">
                <Image
                  src="/images/hero-image.webp"
                  alt="Pakistan's Creative Class"
                  fill
                  priority
                  sizes="100vw"
                  className={styles.heroBgImage}
                />
                <div className={styles.heroBgOverlay} />
              </div>

              <div className={styles.heroInnerCentered}>
                <h1 id="hero-heading" className={styles.heroHeadline} data-reveal>
                  FIND. <span className={styles.yellowText}>HIRE.</span> SHOW UP.
                </h1>

                <p className={styles.heroEditorialSub} data-reveal>
                  // PAKISTAN&rsquo;S CREATIVE CLASS
                </p>

                <div className={styles.heroSearchContainer} data-reveal>
                  <form action="/explore" className={styles.heroSearchForm}>
                    <div className={styles.heroSearchInputWrap}>
                      <div className={styles.heroSearchField}>
                        <Search size={20} className={styles.heroSearchIcon} />
                        <input
                          type="text"
                          name="query"
                          placeholder="SEARCH CREATIVES, EVENTS, OR DISCIPLINE..."
                          className={styles.heroSearchInput}
                          aria-label="Search creatives and events"
                        />
                      </div>
                      <button type="submit" className={styles.heroSearchBtn}>
                        SEARCH
                      </button>
                    </div>
                  </form>

                  <div className={styles.quickFilters}>
                    <span className={styles.quickFilterLabel}>HOT CATEGORIES:</span>
                    <div className={styles.quickFilterItems}>
                      <Link href="/explore?discipline=Music" className={styles.quickFilterLink}>Music</Link>
                      <Link href="/explore?discipline=Photography" className={styles.quickFilterLink}>Photography</Link>
                      <Link href="/explore?discipline=Visual Arts" className={styles.quickFilterLink}>Visual Arts</Link>
                      <Link href="/explore?tab=events" className={styles.quickFilterLink}>Live Events</Link>
                    </div>
                  </div>
                </div>

                <div className={styles.liveStat} data-reveal>
                  <span className={styles.liveStatDot} />
                  <span>{creativeCount} CREATIVES · VOL. 01</span>
                </div>
              </div>
            </section>
          </GSAPHeroReveal>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 02 · PLATFORM DIRECTIVES INDEX + TICKER
            ════════════════════════════════════════════════════ */}
        <div style={{ width: '100%' }}>
          <section id="pillars" className={styles.directivesSection}>
            <div className={styles.sectionHeaderWrap}>
              <span className={styles.navLabelDark}>// PLATFORM DIRECTIVES</span>
              <h2 className={styles.directivesSectionTitle}>HOW WE RUN THE CULTURE</h2>
            </div>

            <div className={styles.directivesTable}>
              <div className={styles.directiveRow} data-pillar="yellow">
                <GSAPLineReveal selector="[data-line]" y={28} stagger={0.07} duration={0.42} start="top 85%">
                  <div className={styles.directiveRowInner}>
                    <div className={styles.dirNumCol} data-line>
                      <span className={styles.dirMono}>01 // INDEX</span>
                      <h3 className={styles.dirHeadline}>DISCOVER</h3>
                    </div>
                    <div className={styles.dirContentCol} data-line>
                      <p className={styles.dirDescription}>
                        Every creative in Pakistan—photographers, printmakers, DJs, directors, makeup artists—in one searchable place. Find by discipline, city, or vibe.
                      </p>
                      <Link href="/explore" className={styles.dirLink}>
                        BROWSE ALL &rarr;
                      </Link>
                    </div>
                    <div className={styles.dirVisualCol} data-line>
                      <div className={styles.dirGraphicStripe} />
                    </div>
                  </div>
                </GSAPLineReveal>
              </div>

              <div className={styles.directiveRow} data-pillar="green">
                <GSAPLineReveal selector="[data-line]" y={28} stagger={0.07} duration={0.42} start="top 85%">
                  <div className={styles.directiveRowInner}>
                    <div className={styles.dirNumCol} data-line>
                      <span className={styles.dirMono}>02 // SERVICE</span>
                      <h3 className={styles.dirHeadline}>HIRE</h3>
                    </div>
                    <div className={styles.dirContentCol} data-line>
                      <p className={styles.dirDescription}>
                        Brief a creative, agree on terms, get the work made. No cold DMs, no dead WhatsApp threads. A crystal-clear process from brief to delivery.
                      </p>
                      <Link href="/auth/signup?role=client" className={styles.dirLink}>
                        POST A BRIEF &rarr;
                      </Link>
                    </div>
                    <div className={styles.dirVisualCol} data-line>
                      <div className={styles.dirGraphicStripe} />
                    </div>
                  </div>
                </GSAPLineReveal>
              </div>

              <div className={styles.directiveRow} data-pillar="dark">
                <GSAPLineReveal selector="[data-line]" y={28} stagger={0.07} duration={0.42} start="top 85%">
                  <div className={styles.directiveRowInner}>
                    <div className={styles.dirNumCol} data-line>
                      <span className={styles.dirMono}>03 // BOX OFFICE</span>
                      <h3 className={styles.dirHeadline}>EXPERIENCE</h3>
                    </div>
                    <div className={styles.dirContentCol} data-line>
                      <p className={styles.dirDescription}>
                        Concerts, gallery nights, masterclasses, street art showcases. Discover what&rsquo;s happening in your city. Secure your spot. Show up.
                      </p>
                      <Link href="#events" className={styles.dirLink}>
                        EXPLORE EVENTS &rarr;
                      </Link>
                    </div>
                    <div className={styles.dirVisualCol} data-line>
                      <div className={styles.dirGraphicStripe} />
                    </div>
                  </div>
                </GSAPLineReveal>
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 03 · THE STAGGERED SHOWCASE + TICKER
            ════════════════════════════════════════════════════ */}
        <div style={{ width: '100%' }}>
          <section id="events" className={styles.showcaseSection}>
            <div className={styles.showcaseHeader}>
              <div className={styles.showcaseLabelBlock}>
                <span className={styles.monoLabelYellow}>// THE SPOTLIGHT REGISTER</span>
                <h2 className={styles.showcaseTitle}>ACTIVE PLATFORM LEDGER</h2>
              </div>
              <Link href="/explore?tab=events" className={styles.showcaseLink}>VIEW ALL EVENTS &rarr;</Link>
            </div>

            <div className={styles.showcaseGrid}>
              <div className={styles.showcaseColPrimary}>
                {liveEvents.length > 0 ? (
                  (() => {
                    const spotlight = liveEvents[0].event;
                    return (
                      <Link href={`/events/${spotlight.slug ?? spotlight.id}`} className={styles.spotlightCard}>
                        <div className={styles.spotlightImageWrap}>
                          {spotlight.cover_image_url ? (
                            <Image
                              src={spotlight.cover_image_url}
                              alt={spotlight.title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 60vw"
                              className={styles.spotlightImage}
                              priority
                            />
                          ) : (
                            <div className={styles.spotlightFallbackImage}>
                              <span className={styles.spotlightFallbackText}>STAGD SPOTLIGHT</span>
                            </div>
                          )}
                          <span className={styles.spotlightBadge}>FEATURED EVENT</span>
                        </div>
                        <div className={styles.spotlightContent}>
                          <div className={styles.spotlightMeta}>
                            <span>{spotlight.event_type.toUpperCase()}</span>
                            <span>·</span>
                            <span>{formatDateTime(spotlight.starts_at)}</span>
                          </div>
                          <h3 className={styles.spotlightTitle}>{spotlight.title}</h3>
                          <p className={styles.spotlightDesc}>
                            {spotlight.venue_name ? `${spotlight.venue_name} · ` : ''}
                            {spotlight.is_free ? 'FREE ENTRANCE' : `PKR ${spotlight.min_price.toLocaleString()}`}
                          </p>
                          <span className={styles.spotlightCta}>GET TICKETS &rarr;</span>
                        </div>
                      </Link>
                    );
                  })()
                ) : (
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightImageWrap}>
                      <div className={styles.spotlightFallbackImage} />
                      <span className={styles.spotlightBadge}>SPOTLIGHT SYSTEM</span>
                    </div>
                    <div className={styles.spotlightContent}>
                      <h3 className={styles.spotlightTitle}>No active spotlight events registered.</h3>
                      <Link href="/events/create" className={styles.spotlightCta}>REGISTER YOUR INITIATIVE &rarr;</Link>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.showcaseColSecondary}>
                <div className={styles.ledgerHeader}>// ACTIVE REGISTRY ENTRIES</div>
                <div className={styles.ledgerList}>
                  {liveEvents.slice(1, 5).map(({ event: ev }) => (
                    <Link key={ev.id} href={`/events/${ev.slug ?? ev.id}`} className={styles.ledgerRow}>
                      <div className={styles.ledgerRowTop}>
                        <span className={styles.ledgerTag}>{ev.event_type}</span>
                        <span className={styles.ledgerPrice}>
                          {ev.is_free ? 'FREE' : `PKR ${ev.min_price.toLocaleString()}`}
                        </span>
                      </div>
                      <h4 className={styles.ledgerRowTitle}>{ev.title}</h4>
                      <div className={styles.ledgerRowMeta}>
                        <span>{ev.venue_name ?? 'VENUE N/A'}</span>
                        <span>·</span>
                        <span>{formatDateTime(ev.starts_at)}</span>
                      </div>
                    </Link>
                  ))}

                  {liveEvents.length < 3 && PLACEHOLDER_EVENTS.map((p, i) => (
                    <div key={i} className={styles.ledgerRowPlaceholder}>
                      <div className={styles.ledgerRowTop}>
                        <span className={styles.ledgerTag}>SYSTEM REGISTER</span>
                      </div>
                      <h4 className={styles.ledgerRowTitle}>{p.name}</h4>
                      <div className={styles.ledgerRowMeta}>
                        <span>{p.venue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 04 · THE TYPOGRAPHIC MANIFESTO + TICKER
            ════════════════════════════════════════════════════ */}
        <div style={{ width: '100%' }}>
          <section className={styles.manifestoSection}>
            <div className={styles.manifestoInner}>
              <div className={styles.manifestoLeft}>
                <span className={styles.monoLabelYellow}>// OUR STATEMENT</span>
                <blockquote className={styles.manifestoQuote}>
                  &ldquo;We believe Pakistan&rsquo;s creative class deserves a prestigious stage of record. Zero cold DMs, zero lost briefs, and zero administrative chaos.&rdquo;
                </blockquote>
              </div>

              <div className={styles.manifestoRight}>
                <div className={styles.manifestoStepsLabel}>// SYSTEM MECHANICS</div>
                <div className={styles.manifestoStepRow}>
                  <span className={styles.stepNum}>01</span>
                  <div className={styles.stepBody}>
                    <h4 className={styles.stepTitle}>BUILD YOUR PROFILE</h4>
                    <p className={styles.stepDesc}>Register your credentials, portfolio, rates, and verification metrics in one standard index.</p>
                  </div>
                </div>
                <div className={styles.manifestoStepRow}>
                  <span className={styles.stepNum}>02</span>
                  <div className={styles.stepBody}>
                    <h4 className={styles.stepTitle}>CLEAR DISPATCH</h4>
                    <p className={styles.stepDesc}>Dispatch briefs, confirm rates, and securely escrow creative agreements on standard terms.</p>
                  </div>
                </div>
                <div className={styles.manifestoStepRow}>
                  <span className={styles.stepNum}>03</span>
                  <div className={styles.stepBody}>
                    <h4 className={styles.stepTitle}>EXPERIENCE BOX OFFICE</h4>
                    <p className={styles.stepDesc}>Discover live physical gatherings, purchase verified tickets, and gain entry via dynamic QR verification.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 05 · THE ACTIVE ROSTER GRID
            ════════════════════════════════════════════════════ */}
        {showFeatured && (
          <section className={styles.creativesSection} aria-labelledby="creatives-heading">
            <div className={styles.creativesHeader}>
              <div className={styles.creativesLabelBlock}>
                <span className={styles.navLabelDark}>// ACTIVE ROSTER REGISTER</span>
                <h2 id="creatives-heading" className={styles.creativesTitle}>
                  THE PEOPLE YOU SHOULD KNOW ABOUT
                </h2>
              </div>
              <Link href="/explore" className={styles.creativesLink}>BROWSE ALL REGISTERED &rarr;</Link>
            </div>
            <GSAPEntrance selector="[data-card]" y={28} stagger={0.05} duration={0.38} start="top 92%">
              <div className={styles.creativesGrid}>
                {featuredArtists.map(({ user: artist, profile, portfolio }) => (
                  <Link
                    key={artist.id}
                    href={`/${artist.username}`}
                    className={styles.creativeCard}
                    data-card
                  >
                    <div className={styles.creativeImageWrap}>
                      {artist.avatar_url ? (
                        <Image
                          src={artist.avatar_url}
                          alt={artist.full_name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className={styles.creativeImage}
                        />
                      ) : (
                        <div className={styles.creativeImageFallback} />
                      )}

                      {/* Premium Hover Showcase of Creative's Work */}
                      <div className={styles.creativeHoverOverlay}>
                        {portfolio && portfolio.length > 0 ? (
                          <div className={styles.portfolioHoverGrid}>
                            {portfolio.slice(0, 4).map((item: any, idx: number) => (
                              <div key={item.id || idx} className={styles.portfolioHoverItem}>
                                <Image
                                  src={item.image_url}
                                  alt={item.title || artist.full_name}
                                  fill
                                  sizes="25vw"
                                  className={styles.portfolioHoverImg}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noPortfolioHover}>
                            <span className={styles.creativeHoverLabel}>ENTER PORTFOLIO →</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.creativeCardBody}>
                      <div className={styles.creativeCardHeader}>
                        <p className={styles.creativeName}>{artist.full_name}</p>
                        {artist.city && (
                          <p className={styles.creativeCity}>{artist.city.toUpperCase()}</p>
                        )}
                      </div>
                      <div className={styles.creativeTags}>
                        {(profile?.disciplines ?? []).slice(0, 2).map((d: string) => (
                          <span key={d} className={styles.creativeTag}>{d.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </GSAPEntrance>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            CARD 06 · HIGH-IMPACT ACTION (CTA Canvas)
            ════════════════════════════════════════════════════ */}
        <section className={styles.ctaCanvasSection} aria-labelledby="cta-canvas-heading">
          <div className={styles.heroGrain} aria-hidden="true" />
          <div className={styles.ctaCanvasInner}>
            <div className={styles.ctaCanvasLeft}>
              <span className={styles.ctaCanvasVolume}>// VOL. 01 // PLATFORM FINALE</span>
              <h2 id="cta-canvas-heading" className={styles.ctaCanvasHeading}>
                GET ON <StagdLogo width={220} height={88} className={styles.ctaHeadingLogo} />
              </h2>
              <p className={styles.ctaCanvasLeftDesc}>
                Your work deserves better than a Google Drive link and a WhatsApp thread. Build your profile, lock in clients, and ticket your own events — one place, one link.
              </p>
            </div>

            <div className={styles.ctaCanvasRight}>
              <div className={styles.ctaCard}>
                <div className={styles.ctaCardHeader}>
                  <span className={styles.ctaCardTag}>// PLATFORM REGISTER VOUCHER</span>
                  <span className={styles.ctaCardAccess}>ACCESS: OPEN</span>
                </div>

                <div className={styles.ctaCardBody}>
                  <p className={styles.ctaCardText}>
                    Pitch clients directly, get discovered on your terms, and sell tickets to your own events — all from one place.</p>

                  <div className={styles.ctaBenefitsList}>
                    <div className={styles.ctaBenefitItem}>
                      <span className={styles.ctaBenefitDot} />
                      <span className={styles.ctaBenefitText}>PROPOSALS. INVOICES. NO WHATSAPP CHAOS</span>
                    </div>
                    <div className={styles.ctaBenefitItem}>
                      <span className={styles.ctaBenefitDot} />
                      <span className={styles.ctaBenefitText}>ZERO CUT ON COMMISSIONS</span>
                    </div>
                    <div className={styles.ctaBenefitItem}>
                      <span className={styles.ctaBenefitDot} />
                      <span className={styles.ctaBenefitText}>YOUR PORTFOLIO. YOUR LINK. YOUR CLIENTS</span>
                    </div>
                  </div>
                </div>

                <div className={styles.ctaCardFooter}>
                  <Link href="/auth/signup?role=creative" className={styles.ctaBtnPrimary}>
                    REGISTER NOW
                  </Link>
                  <Link href="/explore" className={styles.ctaBtnSecondary}>
                    EXPLORE &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </InteractiveCardDeck>
    </div>
  );
}

const PLACEHOLDER_EVENTS = [
  { name: 'Be the first to create an event in Karachi', venue: 'Your venue here' },
  { name: 'Gallery night. Concert. Workshop.', venue: 'Any city in Pakistan' },
];
