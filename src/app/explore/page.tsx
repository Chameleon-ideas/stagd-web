import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';
import { WorkstationLayout } from '@/components/layout/WorkstationLayout';
import { searchArtists, searchEvents } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover and hire Pakistan\'s top creative talent. Browse artist portfolios, upcoming events, and professional registries.',
};

interface ExplorePageProps {
  searchParams: Promise<{ tab?: string; query?: string; discipline?: string }>;
}

export const revalidate = 120;

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'creatives';

  let initialResults = { data: [], total: 0 };
  try {
    if (activeTab === 'events') {
      initialResults = await searchEvents() as any;
    } else {
      initialResults = await searchArtists({
        discipline: params.discipline && params.discipline !== 'All' ? params.discipline : undefined,
        query: params.query || undefined,
      }) as any;
    }
  } catch (err) {
    console.error('Explore SSR fetch failed:', err);
  }

  return (
    <WorkstationLayout>
      <ExploreClient
        initialTab={activeTab}
        initialQuery={params.query ?? ''}
        initialDiscipline={params.discipline ?? 'All'}
        initialResults={initialResults}
      />
    </WorkstationLayout>
  );
}
