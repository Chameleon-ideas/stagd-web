import type { Metadata } from 'next';
import { EditorialLayout } from '@/components/layout/EditorialLayout';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Manifesto — Stagd',
  description: 'The creative economy is here. Found. Hired. Celebrated.',
};

export default function AboutPage() {
  return (
    <EditorialLayout>
      <main className={styles.aboutPage}>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroMeta}>// EST. 2026 / KARACHI / VOL 01</div>
            <h1 className={styles.heroStatement}>
              THE CREATIVE<br />
              <span className={styles.highlight}>ECONOMY</span> IS<br />
              NOW LIVE<span className={styles.dot}>.</span>
            </h1>
            <div className={styles.heroLead}>
              Found. Hired. Celebrated.
            </div>
            <p className={styles.heroBody}>
              Stagd is Pakistan's premier professional registry and discovery engine,
              architected specifically for the independent creative class. We provide the
              infrastructure to connect world-class talent with the brands, collectors,
              and global audiences who define modern culture.
            </p>
          </div>
        </section>

        {/* Manifesto Section */}
        <section className={styles.manifesto}>
          <div className="container">
            <div className={styles.manifestoGrid}>

              <div className={`${styles.manifestoCard} ${styles.cardGreen}`}>
                <div className={styles.cardNum}>[ 01 ]</div>
                <h2 className={styles.cardTitle}>DISCOVERY</h2>
                <p className={styles.cardBody}>
                  The era of informal networks is over. Stagd provides a high-fidelity, verified
                  database for the creative sector. Discover the precise talent required for
                  your next vision in seconds.
                </p>
              </div>

              <div className={`${styles.manifestoCard} ${styles.cardCyan}`}>
                <div className={styles.cardNum}>[ 02 ]</div>
                <h2 className={styles.cardTitle}>COMMISSIONS</h2>
                <p className={styles.cardBody}>
                  Professional workflows for professional work. We provide the essential
                  infrastructure for hiring, contracting, and managing creative projects
                  with technical precision.
                </p>
              </div>

              <div className={`${styles.manifestoCard} ${styles.cardRed}`}>
                <div className={styles.cardNum}>[ 03 ]</div>
                <h2 className={styles.cardTitle}>EVENTS</h2>
                <p className={styles.cardBody}>
                  If it matters to the culture, it's on the map. Stagd is the central hub
                  for independent shows, exhibitions, and cultural workshops that define
                  Pakistan's offline creative scene.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className={styles.vision}>
          <div className="container">
            <div className={styles.visionSplit}>
              <div className={styles.visionLeft}>
                <div className={styles.visionMeta}>// THE MISSION</div>
                <h2 className={styles.visionHeading}>
                  EMPOWERING THE<br />
                  CREATIVES<span className={styles.dot}>.</span>
                </h2>
              </div>
              <div className={styles.visionRight}>
                <p className={styles.visionBody}>
                  For too long, Pakistan's most talented creators have operated in the shadows
                  of informal networks. Stagd was born out of a simple necessity: to give
                  independent creatives a professional workstation that matches the exceptional
                  quality of their output.
                </p>
                <p className={styles.visionBody}>
                  We believe that when creatives are discovered easily and hired fairly, the entire
                  economy grows. This isn't just a platform; it's a structural upgrade for the
                  nation's cultural fabric.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaBox}>
              <h2 className={styles.ctaHeading}>READY TO LEVEL UP?</h2>
              <Link href="/explore" className={styles.ctaPrimary}>
                JOIN THE NETWORK →
              </Link>
            </div>
          </div>
        </section>

      </main>
    </EditorialLayout>
  );
}
