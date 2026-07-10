import { el } from '../utils/dom.js';

export function renderFooter() {
  const year = 2026; // Static build; project is scoped to the 2026 course term.
  const footer = el('footer', { class: 'ev-footer mt-auto py-4' });
  footer.innerHTML = `
    <div class="container">
      <div class="row gy-3 align-items-center">
        <div class="col-md-6">
          <div class="brand-logo d-flex align-items-center gap-2 text-white">
            <i class="bi bi-calendar2-heart-fill"></i> Eventide
          </div>
          <p class="small mb-0 mt-1" style="opacity:.75">
            Discover &amp; host community events. A SoftUni "Software Technologies with AI" project.
          </p>
        </div>
        <div class="col-md-6 text-md-end">
          <a class="me-3" href="#/">Browse</a>
          <a class="me-3" href="#/register">Sign up</a>
          <a href="https://github.com/VeselinGerenski/AI-development-July-2026" target="_blank" rel="noopener">
            <i class="bi bi-github"></i> GitHub
          </a>
          <p class="small mb-0 mt-2" style="opacity:.6">© ${year} Eventide</p>
        </div>
      </div>
    </div>`;
  return footer;
}
