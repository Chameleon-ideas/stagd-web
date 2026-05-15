import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';
import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover and hire Pakistan\'s top creative talent. Browse artist portfolios, upcoming events, and professional registries.',
};

interface ExplorePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'creatives';

  return (
    <WorkstationLayout>
      <ExploreClient initialTab={activeTab} />
    </WorkstationLayout>
  );
}
