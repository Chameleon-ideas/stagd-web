import { NextResponse } from 'next/server';
import { generateTicketQR } from '@/lib/qrfy';

export async function POST(request: Request) {
  try {
    const { ticketId } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const qrUrl = await generateTicketQR(ticketId);
    
    return NextResponse.json({ qrUrl });
  } catch (error) {
    console.error('QR Generation Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
