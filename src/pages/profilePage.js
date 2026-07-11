import { el, escapeHtml } from '../utils/dom.js';
import { getSession, refreshProfile } from '../session.js';
import { requireAuth } from '../utils/guards.js';
import { getProfile, updateProfile } from '../services/authService.js';
import { uploadImage, validateImage } from '../services/storageService.js';
import { avatarHtml } from '../components/avatar.js';
import { showToast } from '../components/toast.js';

export async function render() {
  if (!requireAuth()) return el('div');
  const session = getSession();

  // Prefer a fresh read so the form reflects the latest saved values.
  const profile = (await getProfile(session.user.id).catch(() => null)) || session.profile || {};

  let avatarUrl = profile.avatar_url || null;
  let avatarFile = null;

  const page = el('div', { class: 'container py-5 min-vh-content' });
  page.append(el('h1', { class: 'fw-bold mb-4' }, 'My profile'));

  const card = el('form', { class: 'card p-4 p-md-5', novalidate: true, style: 'max-width: 720px' });
  card.innerHTML = `
    <div class="d-flex flex-column flex-sm-row align-items-center gap-4 mb-4">
      <div id="avatar-holder">${avatarHtml(profile, 96)}</div>
      <div>
        <label class="btn btn-outline-brand btn-sm mb-1">
          <i class="bi bi-camera me-1"></i> Change photo
          <input type="file" accept="image/*" id="avatar-input" hidden>
        </label>
        <div class="form-text">JPG, PNG, WebP or GIF, up to 5 MB.</div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Username</label>
        <input type="text" class="form-control" value="${escapeHtml(profile.username || '')}" disabled>
        <div class="form-text">Usernames can't be changed.</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" value="${escapeHtml(session.user.email || '')}" disabled>
      </div>
    </div>

    <div class="mt-3">
      <label class="form-label" for="p-fullname">Full name</label>
      <input type="text" class="form-control" id="p-fullname" maxlength="80" value="${escapeHtml(profile.full_name || '')}" placeholder="Your name">
    </div>

    <div class="mt-3">
      <label class="form-label" for="p-bio">Bio</label>
      <textarea class="form-control" id="p-bio" rows="3" maxlength="500" placeholder="Tell people a bit about yourself…">${escapeHtml(profile.bio || '')}</textarea>
      <div class="form-text"><span id="bio-count">${(profile.bio || '').length}</span>/500</div>
    </div>

    <div class="alert alert-danger py-2 mt-3 d-none" id="p-error"></div>

    <button type="submit" class="btn btn-gradient px-4 mt-3" id="p-save">
      <i class="bi bi-check2-circle me-1"></i> Save changes
    </button>`;

  const avatarInput = card.querySelector('#avatar-input');
  const avatarHolder = card.querySelector('#avatar-holder');
  const bio = card.querySelector('#p-bio');
  const bioCount = card.querySelector('#bio-count');
  const errorBox = card.querySelector('#p-error');
  const saveBtn = card.querySelector('#p-save');

  bio.addEventListener('input', () => (bioCount.textContent = bio.value.length));

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    try {
      validateImage(file);
    } catch (err) {
      showToast(err.message, 'error');
      avatarInput.value = '';
      return;
    }
    avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      avatarHolder.innerHTML = `<img src="${reader.result}" alt="" class="rounded-circle" style="width:96px;height:96px;object-fit:cover">`;
    };
    reader.readAsDataURL(file);
  });

  card.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving…';
    try {
      if (avatarFile) {
        const { url } = await uploadImage('avatars', session.user.id, avatarFile);
        avatarUrl = url;
      }
      await updateProfile(session.user.id, {
        full_name: card.querySelector('#p-fullname').value.trim() || null,
        bio: bio.value.trim() || null,
        avatar_url: avatarUrl,
      });
      await refreshProfile(); // updates the navbar avatar/name
      showToast('Profile updated.', 'success');
    } catch (err) {
      errorBox.textContent = err?.message || 'Could not save your profile.';
      errorBox.classList.remove('d-none');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save changes';
    }
  });

  page.append(card);
  return page;
}
