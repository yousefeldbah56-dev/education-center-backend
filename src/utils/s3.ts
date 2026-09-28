import { env } from '../config/env.js';

/**
 * 📦 S3 Storage Configuration & Helper
 * Generates structured S3 object keys and handles presigned URL generation.
 */

export interface S3UploadParams {
  folder: 'videos' | 'pdfs' | 'avatars';
  filename: string;
  contentType: string;
}

/**
 * Generate a unique, sanitized S3 key for storage.
 * e.g. "videos/1740000000-lesson-1.mp4"
 */
export function generateS3Key(folder: string, originalFilename: string): string {
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${sanitized}`;
}

/**
 * Get S3 Public / CloudFront URL for a given key.
 */
export function getMediaUrl(key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}
