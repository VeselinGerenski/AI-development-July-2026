import { el, escapeHtml } from '../utils/dom.js';
import { toDateTimeLocal } from '../utils/format.js';
import { uploadImage, validateImage } from '../services/storageService.js';
import { getSession } from '../session.js';
import { showToast } from './toast.js';

/**
 * Build a create/edit event form.
 * @param {{ categories: any[], event?: any, submitLabel?: string,
 *           onSave: (payload) => Promise<{id:string}> }} opts
 */
export function eventForm({ categories, event = null, submitLabel = 'Publish event', onSave }) {
  const isEdit = !!event;
  let bannerUrl = event?.banner_url || null;
  let bannerFile = null;

  const form = el('form', { class: 'card p-4 p-md-5', novalidate: true });
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label fw-semibold" for="f-title">Event title</label>
      <input type="text" class="form-control form-control-lg" id="f-title" required
             minlength="3" maxlength="120" value="${escapeHtml(event?.title || '')}"
             placeholder="e.g. Summer Rooftop Jazz Night">
    </div>

    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label fw-semibold" for="f-category">Category</label>
        <select class="form-select" id="f-category" required>
          <option value="" disabled ${!event ? 'selected' : ''}>Choose a category…</option>
          ${categories.map((c) => `
            <option value="${c.id}" ${event?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
          `).join('')}
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-semibold" for="f-date">Date &amp; time</label>
        <input type="datetime-local" class="form-control" id="f-date" required
               value="${event?.event_date ? toDateTimeLocal(event.event_date) : ''}">
      </div>
    </div>

    <div class="row g-3 mt-0">
      <div class="col-md-8">
        <label class="form-label fw-semibold" for="f-location">Location</label>
        <input type="text" class="form-control" id="f-location" required maxlength="200"
               value="${escapeHtml(event?.location || '')}" placeholder="Venue and address / city">
      </div>
      <div class="col-md-4">
        <label class="form-label fw-semibold" for="f-capacity">Capacity <span class="text-muted fw-normal">(optional)</span></label>
        <input type="number" class="form-control" id="f-capacity" min="1"
               value="${event?.capacity ?? ''}" placeholder="e.g. 100">
      </div>
    </div>

    <div class="mt-3">
      <label class="form-label fw-semibold" for="f-description">Description</label>
      <textarea class="form-control" id="f-description" rows="5" required minlength="10" maxlength="5000"
                placeholder="Tell people what to expect…">${escapeHtml(event?.description || '')}</textarea>
    </div>

    <div class="mt-3">
      <label class="form-label fw-semibold">Banner image</label>
      <div class="border rounded-4 p-3 d-flex flex-column flex-sm-row align-items-center gap-3">
        <div id="banner-preview" class="rounded-3 bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
             style="width:160px;height:100px">
          ${bannerUrl
            ? `<img src="${escapeHtml(bannerUrl)}" alt="" style="width:100%;height:100%;object-fit:cover">`
            : `<i class="bi bi-image text-muted fs-2"></i>`}
        </div>
        <div class="flex-grow-1">
          <input type="file" class="form-control" id="f-banner" accept="image/*">
          <div class="form-text">JPG, PNG, WebP or GIF, up to 5 MB. Optional — a themed placeholder is used otherwise.</div>
        </div>
      </div>
    </div>

    <div class="alert alert-danger py-2 mt-3 d-none" id="form-error"></div>

    <div class="d-flex gap-2 mt-4">
      <button type="submit" class="btn btn-gradient px-4" id="form-submit">
        <i class="bi bi-check2-circle me-1"></i> ${escapeHtml(submitLabel)}
      </button>
      <a href="${isEdit ? `#/events/${event.id}` : '#/'}" class="btn btn-outline-secondary">Cancel</a>
    </div>
    ${!isEdit ? `<p class="text-muted small mt-3 mb-0"><i class="bi bi-info-circle me-1"></i>
      New events are reviewed by an admin before appearing publicly.</p>` : ''}`;

  const fileInput = form.querySelector('#f-banner');
  const preview = form.querySelector('#banner-preview');
  const errorBox = form.querySelector('#form-error');
  const submitBtn = form.querySelector('#form-submit');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      validateImage(file);
    } catch (err) {
      showError(err.message);
      fileInput.value = '';
      return;
    }
    bannerFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      preview.innerHTML = `<img src="${reader.result}" alt="" style="width:100%;height:100%;object-fit:cover">`;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');

    const title = form.querySelector('#f-title').value.trim();
    const categoryId = form.querySelector('#f-category').value;
    const dateVal = form.querySelector('#f-date').value;
    const location = form.querySelector('#f-location').value.trim();
    const capacityVal = form.querySelector('#f-capacity').value;
    const description = form.querySelector('#f-description').value.trim();

    if (title.length < 3) return showError('Title must be at least 3 characters.');
    if (!categoryId) return showError('Please choose a category.');
    if (!dateVal) return showError('Please choose a date and time.');
    if (!location) return showError('Please add a location.');
    if (description.length < 10) return showError('Description must be at least 10 characters.');

    setLoading(true);
    try {
      // Upload a new banner if one was selected.
      if (bannerFile) {
        const { url } = await uploadImage('event-banners', getSession().user.id, bannerFile);
        bannerUrl = url;
      }

      const payload = {
        title,
        category_id: categoryId,
        event_date: new Date(dateVal).toISOString(),
        location,
        capacity: capacityVal ? parseInt(capacityVal, 10) : null,
        description,
        banner_url: bannerUrl,
      };

      const saved = await onSave(payload);
      showToast(isEdit ? 'Event updated.' : 'Event submitted for review.', 'success');
      window.location.hash = `#/events/${saved.id}`;
    } catch (err) {
      showError(err?.message || 'Could not save the event.');
      setLoading(false);
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner-border spinner-border-sm me-1"></span> Saving…'
      : `<i class="bi bi-check2-circle me-1"></i> ${escapeHtml(submitLabel)}`;
  }

  return form;
}
