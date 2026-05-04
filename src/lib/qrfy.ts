/**
 * QRFY Utility
 * Handles generation of QR codes via the QRFY API.
 */

const QRFY_API_KEY = process.env.QRFY_API_KEY;
const QRFY_BASE_URL = 'https://api.qrfy.com/api/public';

interface QRFYResponse {
  id: string;
  url: string; // The short URL for the QR code
  image_url: string; // The URL to the QR code image
}

/**
 * Generate a dynamic QR code for a ticket.
 * Returns the URL of the generated QR code image.
 */
export async function generateTicketQR(ticketId: string): Promise<string> {
  if (!QRFY_API_KEY) {
    console.warn('QRFY_API_KEY not set. Falling back to mock QR.');
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;
  }

  try {
    // Note: This is a placeholder for the actual QRFY API call.
    // Based on typical QRFY public API structure.
    const response = await fetch(`${QRFY_BASE_URL}/qrs/png`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QRFY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `Ticket ${ticketId}`,
        type: 'url',
        data: {
          url: `https://stagd.app/verify/${ticketId}`,
        },
        // Optional styling
        style: {
          qrColor: '#000000',
          backgroundColor: '#FFFFFF',
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`QRFY API error: ${response.status}`);
    }

    const result = await response.json();
    return result.image_url;
  } catch (error) {
    console.error('Failed to generate QRFY QR:', error);
    // Fallback to a basic QR generator if QRFY fails
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}`;
  }
}
