import QRCode from 'qrcode';

export async function generateBrandedQR(ticketId: string): Promise<string> {
  const size = 400;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, ticketId, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 2,
    color: { dark: '#111111', light: '#ffffff' },
  });

  const ctx = canvas.getContext('2d')!;
  const logoSize = Math.round(size * 0.22);
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;

  await new Promise<void>((resolve) => {
    const logo = new window.Image();
    logo.onload = () => {
      // White padding behind logo so QR quiet zone is preserved
      const pad = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2);
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      resolve();
    };
    logo.onerror = () => resolve(); // QR still works without logo
    logo.src = '/images/stagd-logo.svg';
  });

  return canvas.toDataURL('image/png');
}
