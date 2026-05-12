"use client";

import { useState, useEffect, use } from 'react';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { ControlTemplate } from '@/components/portfolio/ControlTemplate';
import styles from './page.module.css';

interface ArtistPageProps {
  params: Promise<{ username: string }>;
}

import { WorkstationLayout } from '@/components/layout/WorkstationLayout';

export default function ProfileClient({ params }: ArtistPageProps) {
  const { username } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const p = await getArtistProfile(username);
        setProfile(p);
        if (p) {
          const e = await getArtistEvents(p.user.id);
          setEvents(e);
        }
      } catch (err) {
        console.error('Failed to load artist profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [username]);

  if (loading) {
    return (
      <WorkstationLayout>
        <main className={styles.main} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase' }}>
            Initializing installation...
          </p>
        </main>
      </WorkstationLayout>
    );
  }

  if (!profile) return (
    <WorkstationLayout>
      <main className={styles.main} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Portfolio not found</p>
      </main>
    </WorkstationLayout>
  );

  return (
    <WorkstationLayout>
      <ControlTemplate profile={profile} events={events} />
    </WorkstationLayout>
  );
}
