import { el } from '../utils/dom.js';

export async function render() {
  const page = el('div', { class: 'container text-center py-5 my-5 min-vh-content' });
  page.innerHTML = `
    <div class="display-1 fw-bold text-gradient">404</div>
    <h2 class="fw-bold mb-2">Page not found</h2>
    <p class="text-muted mb-4">The page you're looking for doesn't exist or has moved.</p>
    <a href="#/" class="btn btn-gradient px-4"><i class="bi bi-house-door me-1"></i> Back home</a>`;
  return page;
}
