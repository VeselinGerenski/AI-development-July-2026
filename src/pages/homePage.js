import { el } from '../utils/dom.js';

// Home page. The hero is in place now; the live event grid + filters are added
// in the events commit. Kept in its own file per the multi-page architecture.
export async function render() {
  const page = el('div', {});

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
            <a href="#browse" class="btn btn-outline-light btn-lg px-4">Browse events</a>
          </div>
        </div>
        <div class="col-lg-5 d-none d-lg-block text-center">
          <i class="bi bi-calendar2-heart-fill" style="font-size:11rem; opacity:.9;"></i>
        </div>
      </div>
    </div>`;

  const browse = el('section', { id: 'browse', class: 'container py-5' });
  browse.innerHTML = `
    <h2 class="section-title mb-1">Upcoming events</h2>
    <p class="text-muted">The event grid and filters are wired up in the next step.</p>`;

  page.append(hero, browse);
  return page;
}
