import { el, escapeHtml } from '../utils/dom.js';
import { formatDate, isPast, truncate } from '../utils/format.js';

/** A clickable event card linking to the event detail page. */
export function eventCard(event) {
  const cat = event.category;
  const past = isPast(event.event_date);

  const banner = event.banner_url
    ? `<img src="${escapeHtml(event.banner_url)}" alt="" loading="lazy" decoding="async" style="height:172px;object-fit:cover" class="w-100">`
    : `<div class="w-100 d-flex align-items-center justify-content-center bg-gradient-brand" style="height:172px">
         <i class="bi ${escapeHtml(cat?.icon || 'bi-calendar-event')} text-white" style="font-size:3rem;opacity:.9"></i>
       </div>`;

  const categoryChip = cat
    ? `<span class="chip" style="background:${escapeHtml(cat.color)}1a;color:${escapeHtml(cat.color)}">
         <i class="bi ${escapeHtml(cat.icon)}"></i> ${escapeHtml(cat.name)}
       </span>`
    : '';

  const card = el('a', {
    href: `#/events/${event.id}`,
    class: 'card card-hover h-100 text-decoration-none text-reset',
  });

  card.innerHTML = `
    <div class="position-relative">
      ${banner}
      ${past ? '<span class="badge bg-dark position-absolute top-0 start-0 m-2">Past</span>' : ''}
      <div class="position-absolute bottom-0 end-0 m-2">
        <span class="badge bg-white text-dark shadow-sm">
          <i class="bi bi-people-fill text-primary"></i> ${event.rsvpCount} going
        </span>
      </div>
    </div>
    <div class="card-body d-flex flex-column">
      <div class="mb-2">${categoryChip}</div>
      <h5 class="fw-bold mb-1">${escapeHtml(truncate(event.title, 60))}</h5>
      <p class="text-muted small mb-2">${escapeHtml(truncate(event.description, 90))}</p>
      <div class="mt-auto small">
        <div class="text-primary fw-semibold mb-1"><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(event.event_date))}</div>
        <div class="text-muted"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(truncate(event.location, 40))}</div>
      </div>
    </div>`;

  return card;
}
