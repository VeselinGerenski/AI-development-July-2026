import { el, escapeHtml } from '../utils/dom.js';
import { spinner, emptyState } from '../components/spinner.js';
import { avatarHtml } from '../components/avatar.js';
import { getEvent, deleteEvent } from '../services/eventService.js';
import { getMyRsvp, setRsvp, removeRsvp, listAttendees } from '../services/rsvpService.js';
import { listComments, addComment, deleteComment } from '../services/commentService.js';
import { getSession } from '../session.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';
import { formatDateLong, isPast, timeAgo } from '../utils/format.js';

export async function render({ params }) {
  const eventId = params.id;
  const session = getSession();

  let event;
  try {
    event = await getEvent(eventId);
  } catch (err) {
    return errorPage(err?.message);
  }
  if (!event) {
    return el('div', { class: 'container py-5 min-vh-content' }, emptyState({
      icon: 'bi-calendar-x',
      title: 'Event not available',
      message: 'This event does not exist, or it is awaiting approval.',
      action: el('a', { href: '#/', class: 'btn btn-gradient mt-2' }, 'Back to events'),
    }));
  }

  const [attendees, comments, myRsvp] = await Promise.all([
    listAttendees(eventId).catch(() => []),
    listComments(eventId).catch(() => []),
    session.user ? getMyRsvp(eventId, session.user.id).catch(() => null) : Promise.resolve(null),
  ]);

  const isOwner = session.user && session.user.id === event.organizer_id;
  const canManage = isOwner || session.isAdmin;
  const cat = event.category;

  const page = el('div', { class: 'min-vh-content pb-5' });

  // ---------- Banner ----------
  const banner = el('div', { class: 'position-relative' });
  banner.innerHTML = `
    ${event.banner_url
      ? `<img src="${escapeHtml(event.banner_url)}" alt="" style="height:320px;object-fit:cover" class="w-100">`
      : `<div class="w-100 bg-gradient-hero" style="height:280px"></div>`}
    <div class="position-absolute top-0 start-0 w-100 h-100"
         style="background:linear-gradient(to top, rgba(26,19,48,.85), rgba(26,19,48,.15))"></div>
    <div class="container position-absolute bottom-0 start-50 translate-middle-x pb-4 text-white" style="left:0;right:0">
      ${cat ? `<span class="chip mb-2" style="background:${escapeHtml(cat.color)};color:#fff">
        <i class="bi ${escapeHtml(cat.icon)}"></i> ${escapeHtml(cat.name)}</span>` : ''}
      ${event.status !== 'approved' ? `<span class="badge bg-warning text-dark ms-2 align-middle">${escapeHtml(event.status)}</span>` : ''}
      <h1 class="display-5 fw-bold mb-1">${escapeHtml(event.title)}</h1>
      <div class="d-flex flex-wrap gap-3 small">
        <span><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDateLong(event.event_date))}</span>
        <span><i class="bi bi-geo-alt me-1"></i>${escapeHtml(event.location)}</span>
      </div>
    </div>`;
  page.append(banner);

  // ---------- Body ----------
  const container = el('div', { class: 'container py-4' });
  const row = el('div', { class: 'row g-4' });

  // Main column
  const main = el('div', { class: 'col-lg-8' });

  const about = el('div', { class: 'card p-4 mb-4' });
  about.innerHTML = `
    <h4 class="fw-bold mb-3">About this event</h4>
    <p class="mb-0" style="white-space:pre-wrap">${escapeHtml(event.description)}</p>`;
  main.append(about);
  main.append(buildComments(eventId, comments, session));

  // Sidebar
  const side = el('div', { class: 'col-lg-4' });
  side.append(buildRsvpCard(event, myRsvp, attendees, session));
  side.append(buildOrganizerCard(event));
  if (canManage) side.append(buildManageCard(event, isOwner, session));

  row.append(main, side);
  container.append(row);
  page.append(container);
  return page;
}

// ---------------------------------------------------------------------------
function buildRsvpCard(event, myRsvp, attendees, session) {
  const card = el('div', { class: 'card p-4 mb-4' });
  const past = isPast(event.event_date);

  const render = (rsvp, count) => {
    const capacityLine = event.capacity
      ? `<div class="text-muted small mb-3"><i class="bi bi-people me-1"></i>${count} / ${event.capacity} spots filled</div>`
      : `<div class="text-muted small mb-3"><i class="bi bi-people me-1"></i>${count} going</div>`;

    const avatars = attendees.length
      ? `<div class="d-flex align-items-center mb-3">
           ${attendees.slice(0, 8).map((a) => `<span class="me-n2">${avatarHtml(a.user, 34)}</span>`).join('')}
           ${count > 8 ? `<span class="ms-3 small text-muted">+${count - 8} more</span>` : ''}
         </div>`
      : '';

    let controls;
    if (past) {
      controls = `<div class="alert alert-secondary mb-0 py-2 text-center">This event has ended.</div>`;
    } else if (!session.user) {
      controls = `<a href="#/login" class="btn btn-gradient w-100"><i class="bi bi-box-arrow-in-right me-1"></i> Log in to RSVP</a>`;
    } else {
      const full = event.capacity && count >= event.capacity && !rsvp;
      controls = `
        <div class="d-grid gap-2">
          <div class="btn-group">
            <button class="btn ${rsvp?.status === 'going' ? 'btn-gradient' : 'btn-outline-brand'}" data-rsvp="going" ${full ? 'disabled' : ''}>
              <i class="bi bi-check-circle me-1"></i> Going
            </button>
            <button class="btn ${rsvp?.status === 'maybe' ? 'btn-gradient' : 'btn-outline-brand'}" data-rsvp="maybe">
              <i class="bi bi-question-circle me-1"></i> Maybe
            </button>
          </div>
          ${rsvp ? `<button class="btn btn-link text-danger btn-sm" data-rsvp="cancel">Cancel my RSVP</button>` : ''}
          ${full ? `<div class="small text-danger text-center">This event is full.</div>` : ''}
        </div>`;
    }

    card.innerHTML = `
      <h5 class="fw-bold mb-3"><i class="bi bi-ticket-perforated me-1 text-primary"></i> Attendance</h5>
      ${capacityLine}
      ${avatars}
      ${controls}`;

    card.querySelectorAll('[data-rsvp]').forEach((btn) => {
      btn.addEventListener('click', () => handleRsvp(btn.dataset.rsvp));
    });
  };

  let currentRsvp = myRsvp;
  let currentCount = event.rsvpCount;

  async function handleRsvp(action) {
    try {
      if (action === 'cancel') {
        await removeRsvp(event.id, session.user.id);
        if (currentRsvp) currentCount = Math.max(0, currentCount - 1);
        currentRsvp = null;
        showToast('RSVP cancelled.', 'info');
      } else {
        const existed = !!currentRsvp;
        currentRsvp = await setRsvp(event.id, session.user.id, action);
        if (!existed) currentCount += 1;
        showToast(action === 'going' ? "You're going! 🎉" : 'Marked as maybe.', 'success');
      }
      render(currentRsvp, currentCount);
    } catch (err) {
      showToast(err?.message || 'Could not update your RSVP.', 'error');
    }
  }

  render(currentRsvp, currentCount);
  return card;
}

// ---------------------------------------------------------------------------
function buildOrganizerCard(event) {
  const org = event.organizer;
  const card = el('div', { class: 'card p-4 mb-4' });
  card.innerHTML = `
    <h6 class="text-muted text-uppercase small fw-bold mb-3">Hosted by</h6>
    <div class="d-flex align-items-center gap-3">
      ${avatarHtml(org, 48)}
      <div>
        <div class="fw-semibold">${escapeHtml(org?.full_name || org?.username || 'Organizer')}</div>
        <div class="text-muted small">@${escapeHtml(org?.username || 'user')}</div>
      </div>
    </div>`;
  return card;
}

// ---------------------------------------------------------------------------
function buildManageCard(event, isOwner, session) {
  const card = el('div', { class: 'card p-4 mb-4 border-primary-subtle' });
  card.innerHTML = `
    <h6 class="text-muted text-uppercase small fw-bold mb-3">
      ${isOwner ? 'Manage your event' : 'Admin actions'}
    </h6>
    <div class="d-grid gap-2">
      <a href="#/events/${event.id}/edit" class="btn btn-outline-brand"><i class="bi bi-pencil me-1"></i> Edit event</a>
      <button class="btn btn-outline-danger" id="delete-event"><i class="bi bi-trash me-1"></i> Delete event</button>
    </div>`;
  card.querySelector('#delete-event').addEventListener('click', async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await deleteEvent(event.id);
      showToast('Event deleted.', 'success');
      navigateTo('/dashboard');
    } catch (err) {
      showToast(err?.message || 'Could not delete event.', 'error');
    }
  });
  return card;
}

// ---------------------------------------------------------------------------
function buildComments(eventId, initialComments, session) {
  const wrap = el('div', { class: 'card p-4' });
  const heading = el('h4', { class: 'fw-bold mb-3' });
  const list = el('div', {});
  wrap.append(heading);

  let comments = [...initialComments];

  if (session.user) {
    const form = el('form', { class: 'mb-4' });
    form.innerHTML = `
      <div class="d-flex gap-2 align-items-start">
        ${avatarHtml(session.profile, 40)}
        <div class="flex-grow-1">
          <textarea class="form-control" rows="2" maxlength="1000" placeholder="Add a comment…" required></textarea>
          <div class="text-end mt-2">
            <button class="btn btn-gradient btn-sm" type="submit"><i class="bi bi-send me-1"></i> Post</button>
          </div>
        </div>
      </div>`;
    const textarea = form.querySelector('textarea');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = textarea.value.trim();
      if (!body) return;
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const created = await addComment(eventId, session.user.id, body);
        comments.unshift(created);
        textarea.value = '';
        renderList();
        showToast('Comment posted.', 'success');
      } catch (err) {
        showToast(err?.message || 'Could not post comment.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
    wrap.append(form);
  } else {
    wrap.append(el('p', { class: 'text-muted' }, [
      'Please ',
      el('a', { href: '#/login' }, 'log in'),
      ' to join the conversation.',
    ]));
  }

  wrap.append(list);

  function renderList() {
    heading.textContent = `Comments (${comments.length})`;
    if (!comments.length) {
      list.replaceChildren(el('p', { class: 'text-muted mb-0' }, 'No comments yet. Be the first!'));
      return;
    }
    list.replaceChildren(...comments.map((c) => commentItem(c)));
  }

  function commentItem(c) {
    const canDelete = session.user && (session.user.id === c.user_id || session.isAdmin);
    const item = el('div', { class: 'd-flex gap-2 py-3 border-top' });
    item.innerHTML = `
      ${avatarHtml(c.user, 40)}
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-semibold">@${escapeHtml(c.user?.username || 'user')}</span>
          <span class="text-muted small">${escapeHtml(timeAgo(c.created_at))}</span>
        </div>
        <p class="mb-0" style="white-space:pre-wrap">${escapeHtml(c.body)}</p>
      </div>
      ${canDelete ? `<button class="btn btn-sm btn-link text-danger p-0" title="Delete"><i class="bi bi-trash"></i></button>` : ''}`;
    if (canDelete) {
      item.querySelector('button').addEventListener('click', async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          await deleteComment(c.id);
          comments = comments.filter((x) => x.id !== c.id);
          renderList();
        } catch (err) {
          showToast(err?.message || 'Could not delete comment.', 'error');
        }
      });
    }
    return item;
  }

  renderList();
  return wrap;
}

function errorPage(message) {
  return el('div', { class: 'container py-5 min-vh-content' }, emptyState({
    icon: 'bi-exclamation-triangle',
    title: 'Could not load event',
    message: message || 'Please try again later.',
    action: el('a', { href: '#/', class: 'btn btn-gradient mt-2' }, 'Back to events'),
  }));
}
