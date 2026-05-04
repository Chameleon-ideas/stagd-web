"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TicketCheckout } from './TicketCheckout';
import type { Event } from '@/lib/types';

interface TicketButtonProps {
  event: Event;
  className?: string;
}

/**
 * TicketButton (Client Component)
 * Handles opening the purchase modal on the event page.
 * Uses a Portal to ensure the modal is rendered at the root level, 
 * preventing z-index and stacking context issues.
 */
export function TicketButton({ event, className }: TicketButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <>
      <button 
        className={className}
        disabled={event.is_sold_out}
        onClick={() => setIsOpen(true)}
      >
        {event.is_sold_out ? 'Sold Out' : 'Get Tickets'}
      </button>

      {isOpen && mounted && createPortal(
        <TicketCheckout 
          event={event} 
          onClose={() => setIsOpen(false)} 
        />,
        document.body
      )}
    </>
  );
}
