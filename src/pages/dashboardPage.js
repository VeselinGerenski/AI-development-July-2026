import { el, escapeHtml } from '../utils/dom.js';
import { spinner, emptyState } from '../components/spinner.js';
import { eventCard } from '../components/eventCard.js';
import { listByOrganizer, deleteEvent } from '../services/eventService.js';
import { listMyRsvps } from '../services/rsvpService.js';
import { getSession } from '../session.js';
import { requireAuth } from '../utils/guards.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/format.js';

const STATUS_BADGE = {
  approved: 'bg-success',
  pending: 'bg-warning text-dark',
  rejected: 'bg-danger',
};

export async function render() {
  if (!requireAuth()) return el('div');
  const session = getSession();

  const page = el('div', { class: 'container py-5 min-vh-content' });
  const header = el('div', { class: 'd-flex flex-wrap justify-content-between align-items-center mb-4 gap-2' });
  header.innerHTML = `
    <div>
      <h1 class="fw-bold mb-1">My Events</h1>
      <p class="text-muted mb-0">Manage the events you host and keep track of what you're attending.</p>
    </div>
    <a href="#/events/new" class="btn btn-gradient"><i class="bi bi-plus-circle me-1"></i> Host an event</a>`;
  page.append(header);

  // ----- Hosting section -----
  page.append(el('h4', { class: 'fw-bold mb-3' }, [
    el('i', { class: 'bi bi-megaphone me-2 text-primary' }), 'Events I\'m hosting',
  ]));
  const hostingWrap = el('div', {});
  page.append(hostingWrap, el('hr', { class: 'my-4' }));

  // ----- Attending section -----
  page.append(el('h4', { class: 'fw-bold mb-3' }, [
    el('i', { class: 'bi bi-ticket-perforated me-2 text-primary' }), 'Events I\'m attending',
  ]));
  const attendingWrap = el('div', {});
  page.append(attendingWrap);

  hostingWrap.append(spinner('Loading your events…'));
  attendingWrap.append(spinner('Loading your RSVPs…'));

  // Load both in parallel.
  const [hosting, attending] = await Promise.all([
    listByOrganizer(session.user.id).catch(() => null),
    listMyRsvps(session.user.id).catch(() => null),
  ]);

  renderHosting(hostingWrap, hosting);
  renderAttending(attendingWrap, attending);

  return page;
}

function renderHosting(wrap, events) {
  if (events === null) {
    wrap.replaceChildren(emptyState({ icon: 'bi-exclamation-triangle', title: 'Could not load your events' }));
    return;
  }
  if (!events.length) {
    wrap.replaceChildren(emptyState({
      icon: 'bi-calendar-plus',
      title: 'You haven\'t hosted any events yet',
      message: 'Create your first event and bring people together.',
      action: el('a', { href: '#/events/new', class: 'btn btn-gradient mt-2' }, 'Host an event'),
    }));
    return;
  }
  const row = el('div', { class: 'row g-3' });
  events.forEach((ev) => row.append(el('div', { class: 'col-md-6 col-xl-4' }, hostCard(ev, () => {
    // On delete, remove the column and re-check for empty.
    const remaining = row.querySelectorAll('.col-md-6').length - 1;
    if (remaining <= 0) renderHosting(wrap, []);
  }))));
  wrap.replaceChildren(row);
}

function hostCard(event, onDeleted) {
  const cat = event.category;
  const col = el('div', { class: 'card h-100' });
  col.innerHTML = `
    <div class="position-relative">
      ${event.banner_url
        ? `<img src="${escapeHtml(event.banner_url)}" alt="" style="height:130px;object-fit:cover" class="w-100">`
        : `<div class="w-100 bg-gradient-brand d-flex align-items-center justify-content-center" style="height:130px">
             <i class="bi ${escapeHtml(cat?.icon || 'bi-calendar-event')} text-white fs-2"></i></div>`}
      <span class="badge ${STATUS_BADGE[event.status] || 'bg-secondary'} position-absolute top-0 end-0 m-2 text-capitalize">
        ${escapeHtml(event.status)}
      </span>
    </div>
    <div class="card-body d-flex flex-column">
      <h6 class="fw-bold mb-1">${escapeHtml(event.title)}</h6>
      <div class="small text-muted mb-2"><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(event.event_date))}</div>
      <div class="small text-muted mb-3"><i class="bi bi-people me-1"></i>${event.rsvpCount} going</div>
      <div class="mt-auto d-flex gap-2">
        <a href="#/events/${event.id}" class="btn btn-sm btn-outline-secondary flex-fill">View</a>
        <a href="#/events/${event.id}/edit" class="btn btn-sm btn-outline-brand flex-fill">Edit</a>
        <button class="btn btn-sm btn-outline-danger" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
    </div>`;
  col.querySelector('button').addEventListener('click', async () => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(event.id);
      showToast('Event deleted.', 'success');
      col.closest('.col-md-6')?.remove();
      onDeleted?.();
    } catch (err) {
      showToast(err?.message || 'Could not delete event.', 'error');
    }
  });
  return col;
}

function renderAttending(wrap, rsvps) {
  if (rsvps === null) {
    wrap.replaceChildren(emptyState({ icon: 'bi-exclamation-triangle', title: 'Could not load your RSVPs' }));
    return;
  }
  if (!rsvps.length) {
    wrap.replaceChildren(emptyState({
      icon: 'bi-calendar-heart',
      title: 'No RSVPs yet',
      message: 'Browse events and RSVP to the ones you like.',
      action: el('a', { href: '#/', class: 'btn btn-outline-brand mt-2' }, 'Browse events'),
    }));
    return;
  }
  const row = el('div', { class: 'row g-4' });
  rsvps.forEach((r) => {
    // listMyRsvps embeds the event; adapt it to the shape eventCard expects.
    const ev = { ...r.event, rsvpCount: undefined, category: r.event.category };
    const card = el('a', { href: `#/events/${ev.id}`, class: 'card card-hover h-100 text-decoration-none text-reset' });
    card.innerHTML = `
      ${ev.banner_url
        ? `<img src="${escapeHtml(ev.banner_url)}" alt="" style="height:130px;object-fit:cover" class="w-100">`
        : `<div class="w-100 bg-gradient-brand d-flex align-items-center justify-content-center" style="height:130px">
             <i class="bi ${escapeHtml(ev.category?.icon || 'bi-calendar-event')} text-white fs-2"></i></div>`}
      <div class="card-body">
        <span class="chip mb-2 text-capitalize"><i class="bi bi-check-circle"></i> ${escapeHtml(r.status)}</span>
        <h6 class="fw-bold mb-1">${escapeHtml(ev.title)}</h6>
        <div class="small text-muted"><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(ev.event_date))}</div>
        <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(ev.location || '')}</div>
      </div>`;
    row.append(el('div', { class: 'col-sm-6 col-lg-4' }, card));
  });
  wrap.replaceChildren(row);
}
