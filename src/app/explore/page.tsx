import { searchArtists, searchEvents } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import ExploreClient from './ExploreClient';
import styles from './page.module.css';

interface ExplorePageProps {
  searchParams: Promise<{ 
    tab?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'artists';
  
  // Initial fetch for SSR
  let initialData;
  if (activeTab === 'artists') {
    initialData = await searchArtists();
  } else {
    initialData = await searchEvents();
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* ─── Header ────────────────────────────────────────── */}
        <section className={styles.header}>
          <div className="container">
            <h1 className={styles.title}>Explore</h1>
            <ExploreClient initialData={initialData} initialTab={activeTab} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
