import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const AUDIO_DIR = 'public/audio';

/**
 * Save audio file to local storage and return URL
 * For MVP, we use local file storage instead of cloud blob storage
 */
export async function saveAudioFile(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  // Ensure audio directory exists
  const audioPath = path.join(process.cwd(), AUDIO_DIR);
  
  if (!existsSync(audioPath)) {
    await mkdir(audioPath, { recursive: true });
  }
  
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '-');
  const filePath = path.join(audioPath, sanitizedFilename);
  
  // Write file
  await writeFile(filePath, audioBuffer);
  
  // Return public URL
  return `/audio/${sanitizedFilename}`;
}

