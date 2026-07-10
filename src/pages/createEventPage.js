import { el } from '../utils/dom.js';
import { eventForm } from '../components/eventForm.js';
import { listCategories } from '../services/categoryService.js';
import { createEvent } from '../services/eventService.js';
import { getSession } from '../session.js';
import { requireAuth } from '../utils/guards.js';

export async function render() {
  if (!requireAuth()) return el('div');

  const categories = await listCategories().catch(() => []);
  const session = getSession();

  const page = el('div', { class: 'container py-5 min-vh-content' });
  const header = el('div', { class: 'mb-4' });
  header.innerHTML = `
    <h1 class="fw-bold mb-1">Host an event</h1>
    <p class="text-muted mb-0">Share the details and we'll get it in front of the community.</p>`;

  const form = eventForm({
    categories,
    submitLabel: 'Publish event',
    onSave: (payload) => createEvent({ ...payload, organizer_id: session.user.id }),
  });

  page.append(header, form);
  return page;
}
