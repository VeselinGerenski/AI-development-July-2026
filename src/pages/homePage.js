import { el, escapeHtml } from '../utils/dom.js';
import { spinner, emptyState } from '../components/spinner.js';
import { eventCard } from '../components/eventCard.js';
import { listEvents } from '../services/eventService.js';
import { listCategories } from '../services/categoryService.js';

export async function render({ query = {} } = {}) {
  const page = el('div');
  page.append(buildHero());

  const section = el('section', { id: 'browse', class: 'container py-5' });
  page.append(section);

  const state = {
    search: query.q || '',
    categorySlug: query.category || null,
  };

  let categories = [];
  try {
    categories = await listCategories();
  } catch {
    /* filter bar simply shows no category pills if this fails */
  }

  const header = el('div', { class: 'd-flex flex-wrap justify-content-between align-items-end mb-3 gap-2' });
  header.innerHTML = `
    <div>
      <h2 class="section-title mb-0">Upcoming events</h2>
      <p class="text-muted mb-0">Find something happening near you.</p>
    </div>
    <a href="#/events/new" class="btn btn-gradient"><i class="bi bi-plus-circle me-1"></i> Host an event</a>`;

  const grid = el('div', { class: 'row g-4' });
  section.append(header, buildFilterBar(categories, state, applyFilters), grid);

  await loadEvents();

  async function loadEvents() {
    grid.replaceChildren(el('div', { class: 'col-12' }, spinner('Loading events…')));
    const cat = categories.find((c) => c.slug === state.categorySlug);
    let events = [];
    try {
      events = await listEvents({ categoryId: cat?.id ?? null, search: state.search });
    } catch (err) {
      grid.replaceChildren(el('div', { class: 'col-12' }, emptyState({
        icon: 'bi-exclamation-triangle',
        title: 'Could not load events',
        message: err?.message || 'Please try again.',
      })));
      return;
    }
    if (!events.length) {
      grid.replaceChildren(el('div', { class: 'col-12' }, emptyState({
        icon: 'bi-calendar-x',
        title: 'No events found',
        message: 'Try a different category or search term.',
      })));
      return;
    }
    grid.replaceChildren(...events.map((ev) => el('div', { class: 'col-sm-6 col-lg-4' }, eventCard(ev))));
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (state.categorySlug) params.set('category', state.categorySlug);
    if (state.search) params.set('q', state.search);
    const qs = params.toString();
    // Update the shareable URL without triggering a full route reload.
    history.replaceState(null, '', '#/' + (qs ? `?${qs}` : ''));
    loadEvents();
  }

  return page;
}

function buildHero() {
  const hero = el('section', { class: 'bg-gradient-hero text-white' });
  hero.innerHTML = `
    <div class="container py-5">
      <div class="row align-items-center py-4 g-4">
        <div class="col-lg-7">
          <span class="chip bg-white bg-opacity-25 text-white mb-3">
            <i class="bi bi-geo-alt-fill"></i> Community events near you
          </span>
          <h1 class="display-4 fw-bold mb-3">Find your next<br>unforgettable event.</h1>
          <p class="lead mb-4" style="opacity:.9; max-width:34rem;">
            Discover concerts, meetups, workshops and more — or host your own and
            bring people together on Eventide.
          </p>
          <div class="d-flex flex-wrap gap-2">
            <a href="#/register" class="btn btn-light btn-lg fw-semibold px-4">
              <i class="bi bi-stars me-1"></i> Get started
            </a>
            <button type="button" class="btn btn-outline-light btn-lg px-4" id="hero-browse">Browse events</button>
          </div>
        </div>
        <div class="col-lg-5 d-none d-lg-block text-center">
          <i class="bi bi-calendar2-heart-fill" style="font-size:11rem; opacity:.9;"></i>
        </div>
      </div>
    </div>`;
  hero.querySelector('#hero-browse')?.addEventListener('click', () => {
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  });
  return hero;
}

function buildFilterBar(categories, state, onChange) {
  const wrap = el('div', { class: 'mb-4' });

  const search = el('input', {
    type: 'search',
    class: 'form-control',
    placeholder: 'Search by title or location…',
    value: state.search,
  });
  let debounce;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.search = search.value.trim();
      onChange();
    }, 350);
  });
  const searchWrap = el('div', { class: 'input-group mb-3', style: 'max-width: 520px' }, [
    el('span', { class: 'input-group-text bg-white', html: '<i class="bi bi-search"></i>' }),
    search,
  ]);

  const pills = el('div', { class: 'd-flex flex-wrap gap-2' });
  const makePill = (slug, label, icon) => {
    const active = state.categorySlug === slug || (slug === null && !state.categorySlug);
    const btn = el('button', { class: `btn btn-sm ${active ? 'btn-gradient' : 'btn-outline-brand'}` });
    btn.innerHTML = `${icon ? `<i class="bi ${escapeHtml(icon)} me-1"></i>` : ''}${escapeHtml(label)}`;
    btn.addEventListener('click', () => {
      state.categorySlug = slug;
      pills.querySelectorAll('button').forEach((b) => (b.className = 'btn btn-sm btn-outline-brand'));
      btn.className = 'btn btn-sm btn-gradient';
      onChange();
    });
    return btn;
  };
  pills.append(makePill(null, 'All', 'bi-grid'));
  categories.forEach((c) => pills.append(makePill(c.slug, c.name, c.icon)));

  wrap.append(searchWrap, pills);
  return wrap;
}
