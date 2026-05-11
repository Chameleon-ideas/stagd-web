import ExploreClient from './ExploreClient';
import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

interface ExplorePageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'artists';

  return (
    <WorkstationLayout>
      <ExploreClient initialTab={activeTab} />
    </WorkstationLayout>
  );
}
