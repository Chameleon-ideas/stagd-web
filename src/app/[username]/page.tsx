import { Metadata } from 'next';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import ProfileClient from './ProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await getArtistProfile(username);
    if (!profile) return { title: 'Not Found' };

    const fullName = profile.user.full_name;
    const disciplines = profile.profile.disciplines?.join(', ') || 'Creative';
    const city = profile.user.city || 'Pakistan';

    return {
      title: `${fullName} (@${username})`,
      description: `${fullName} is a ${disciplines} based in ${city}. Explore their portfolio and professional commissions on Stag'd.`,
      openGraph: {
        images: profile.user.avatar_url ? [profile.user.avatar_url] : [],
      },
    };
  } catch (error) {
    return { title: 'Creative Profile' };
  }
}

export const revalidate = 60;

export default async function Page({ params }: Props) {
  const { username } = await params;

  let profile = null;
  let events = null;
  try {
    profile = await getArtistProfile(username);
    if (profile) {
      events = await getArtistEvents(profile.user.id);
    }
  } catch (err) {
    console.error('Failed to load artist profile:', err);
  }

  return <ProfileClient profile={profile} events={events} />;
}
