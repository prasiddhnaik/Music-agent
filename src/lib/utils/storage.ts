import { put } from '@vercel/blob';

/**
 * Save audio file to Vercel Blob Storage and return URL
 */
export async function saveAudioFile(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '-');
  
  // Upload to Vercel Blob
  const blob = await put(`audio/${sanitizedFilename}`, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  });
  
  return blob.url;
}
