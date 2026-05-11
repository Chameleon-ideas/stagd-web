import { searchArtists, searchEvents } from '@/lib/api';
import ExploreClient from './ExploreClient';
import styles from './page.module.css';

export const revalidate = 60; // cache for 60 s, re-fetch in background

interface ExplorePageProps {
  searchParams: Promise<{ 
    tab?: string;
  }>;
}

import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

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
    <WorkstationLayout>
      <ExploreClient initialData={initialData} initialTab={activeTab} />
    </WorkstationLayout>
  );
}
