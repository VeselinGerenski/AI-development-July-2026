import { el, escapeHtml } from '../utils/dom.js';
import { emptyState } from '../components/spinner.js';
import { eventForm } from '../components/eventForm.js';
import { listCategories } from '../services/categoryService.js';
import { getEvent, updateEvent } from '../services/eventService.js';
import { getSession } from '../session.js';
import { requireAuth } from '../utils/guards.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export async function render({ params }) {
  if (!requireAuth()) return el('div');

  const session = getSession();
  const [event, categories] = await Promise.all([
    getEvent(params.id).catch(() => null),
    listCategories().catch(() => []),
  ]);

  if (!event) {
    return el('div', { class: 'container py-5 min-vh-content' }, emptyState({
      icon: 'bi-calendar-x',
      title: 'Event not found',
      message: 'It may have been removed or is not available.',
      action: el('a', { href: '#/dashboard', class: 'btn btn-gradient mt-2' }, 'Back to my events'),
    }));
  }

  // Only the organizer or an admin may edit.
  if (event.organizer_id !== session.user.id && !session.isAdmin) {
    showToast('You can only edit your own events.', 'error');
    navigateTo(`/events/${event.id}`);
    return el('div');
  }

  const page = el('div', { class: 'container py-5 min-vh-content' });
  const header = el('div', { class: 'mb-4' });
  header.innerHTML = `
    <h1 class="fw-bold mb-1">Edit event</h1>
    <p class="text-muted mb-0">Update the details of “${escapeHtml(event.title)}”.</p>`;

  const form = eventForm({
    categories,
    event,
    submitLabel: 'Save changes',
    onSave: (payload) => updateEvent(event.id, payload),
  });

  page.append(header, form);
  return page;
}
