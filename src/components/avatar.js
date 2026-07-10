import { escapeHtml } from '../utils/dom.js';

/** HTML string for a user avatar — image if present, otherwise a gradient initial. */
export function avatarHtml(profile, size = 36) {
  const name = profile?.username || profile?.full_name || 'U';
  if (profile?.avatar_url) {
    return `<img src="${escapeHtml(profile.avatar_url)}" alt="" class="rounded-circle"
      style="object-fit:cover;width:${size}px;height:${size}px">`;
  }
  return `<span class="d-inline-flex align-items-center justify-content-center rounded-circle
    bg-gradient-brand text-white flex-shrink-0"
    style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px;font-weight:600">
    ${escapeHtml(String(name)[0].toUpperCase())}</span>`;
}
