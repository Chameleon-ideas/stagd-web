'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Attendee {
  avatar_url: string | null;
  buyer_name: string;
}

interface AttendeeCountProps {
  eventId: string;
  initialCount: number;
  initialAttendees: Attendee[];
}

const AVATAR_SIZE = 28;
const MAX_SHOWN = 5;
const OVERLAP = 8;

function Avatar({ attendee, index }: { attendee: Attendee; index: number }) {
  const initials = attendee.buyer_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: '50%',
        border: '2px solid var(--bg)',
        overflow: 'hidden',
        position: 'relative',
        marginLeft: index === 0 ? 0 : -OVERLAP,
        flexShrink: 0,
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: MAX_SHOWN - index,
      }}
      title={attendee.buyer_name}
    >
      {attendee.avatar_url ? (
        <Image
          src={attendee.avatar_url}
          alt={attendee.buyer_name}
          fill
          className=""
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      ) : (
        /* Stagd placeholder — yellow circle with initials */
        <div style={{
          width: '100%',
          height: '100%',
          background: '#FFDE0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          color: '#111',
          letterSpacing: '-0.02em',
        }}>
          {initials}
        </div>
      )}
    </div>
  );
}

export function AttendeeCount({ eventId, initialCount, initialAttendees }: AttendeeCountProps) {
  const [count, setCount] = useState(initialCount);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);

  useEffect(() => {
    const channel = supabase
      .channel(`event-attendees-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets', filter: `event_id=eq.${eventId}` },
        async (payload) => {
          const { buyer_id, buyer_name, quantity } = payload.new;
          setCount(prev => prev + (quantity ?? 1));

          // Fetch avatar if buyer has an account
          let avatar_url: string | null = null;
          if (buyer_id) {
            const { data } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', buyer_id)
              .single();
            avatar_url = data?.avatar_url ?? null;
          }

          setAttendees(prev => [{ avatar_url, buyer_name }, ...prev].slice(0, MAX_SHOWN));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (count === 0) return null;

  const shown = attendees.slice(0, MAX_SHOWN);
  const overflow = count - shown.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
      {/* Stacked avatars */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shown.map((a, i) => (
          <Avatar key={i} attendee={a} index={i} />
        ))}
        {overflow > 0 && (
          <div style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: '50%',
            border: '2px solid var(--bg)',
            background: '#222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#888',
            marginLeft: -OVERLAP,
            flexShrink: 0,
            zIndex: 0,
          }}>
            +{overflow}
          </div>
        )}
      </div>

      {/* Count label */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
      }}>
        <strong style={{ color: 'var(--text)' }}>{count.toLocaleString()}</strong> GOING
      </span>
    </div>
  );
}
