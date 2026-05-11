import { notFound } from 'next/navigation';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';
import ProfileClient from './ProfileClient';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Lightweight lookup so getArtistProfile and getArtistEvents can run in parallel.
  // Uses admin client to bypass RLS — this is a server component with no session cookies.
  const { data: ref } = await supabaseAdmin
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
