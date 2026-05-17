"use client";

import { WorkstationLayout } from '@/components/layout/WorkstationLayout';
import { ControlTemplate } from '@/components/portfolio/ControlTemplate';
import styles from './page.module.css';

interface ArtistPageProps {
  profile: any;
  events: any;
}

export default function ProfileClient({ profile, events }: ArtistPageProps) {
  if (!profile) return (
    <WorkstationLayout>
      <main className={styles.main} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase' }}>
          Portfolio not found
        </p>
      </main>
    </WorkstationLayout>
  );

  return (
    <WorkstationLayout>
      <ControlTemplate profile={profile} events={events} />
    </WorkstationLayout>
  );
}
