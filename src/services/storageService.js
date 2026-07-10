// Storage service — uploads user files to Supabase Storage.
// Files are stored under "<userId>/..." so the per-user RLS policies apply.
import { supabase } from '../supabaseClient.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImage(file) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WebP or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }
}

/**
 * Upload an image to a bucket and return its public URL.
 * @param {'event-banners'|'avatars'} bucket
 * @param {string} userId
 * @param {File} file
 */
export async function uploadImage(bucket, userId, file) {
  validateImage(file);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}
