"use client";

import { useState } from 'react';
import { TicketCheckout } from './TicketCheckout';
import type { Event } from '@/lib/types';

interface TicketButtonProps {
  event: Event;
  className?: string;
}

/**
 * TicketButton (Client Component)
 * Handles opening the purchase modal on the event page.
 */
export function TicketButton({ event, className }: TicketButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className={className}
        disabled={event.is_sold_out}
        onClick={() => setIsOpen(true)}
      >
        {event.is_sold_out ? 'Sold Out' : 'Get Tickets'}
      </button>

      {isOpen && (
        <TicketCheckout 
          event={event} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
