export const IMAGE_CONFIG = {
  variants: {
    thumbnail: { width: 400, quality: 75 },
    display: { width: 1200, quality: 85 },
    full: { width: 2400, quality: 90 },
  },
  upload: {
    maxSizeBytes: 20 * 1024 * 1024,
    maxFiles: 10,
    acceptedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    rawExtensions: new Set(['.cr2', '.nef', '.arw', '.raw', '.dng', '.orf', '.rw2', '.pef', '.sr2']),
  },
} as const;

export function validateImageFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');

    if (IMAGE_CONFIG.upload.rawExtensions.has(ext as never)) {
      errors.push(`${file.name}: RAW files (CR2, NEF, ARW) are not supported — please export as JPG or WEBP.`);
      continue;
    }

    if (!IMAGE_CONFIG.upload.acceptedMimeTypes.has(file.type as never)) {
      errors.push(`${file.name}: Unsupported format. Please use JPG, PNG, or WEBP.`);
      continue;
    }

    if (file.size > IMAGE_CONFIG.upload.maxSizeBytes) {
      errors.push(`${file.name} exceeds 20MB.`);
      continue;
    }

    valid.push(file);
  }

  return { valid, errors };
}
