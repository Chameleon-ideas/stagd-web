import { notFound } from 'next/navigation';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import ProfileClient from './ProfileClient';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Lightweight lookup so getArtistProfile and getArtistEvents can run in parallel.
  const { data: ref } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!ref) return notFound();

  const [profile, events] = await Promise.all([
    getArtistProfile(username),
    getArtistEvents(ref.id),
  ]);

  if (!profile) return notFound();

  return <ProfileClient username={username} profile={profile} events={events} />;
}

export const revalidate = 60;
