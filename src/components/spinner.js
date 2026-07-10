import { el } from '../utils/dom.js';

/** Centered loading spinner for async views. */
export function spinner(label = 'Loading…') {
  return el('div', { class: 'text-center py-5 my-5' }, [
    el('div', {
      class: 'spinner-border text-primary',
      role: 'status',
      style: 'width: 3rem; height: 3rem;',
    }, [el('span', { class: 'visually-hidden' }, label)]),
    el('p', { class: 'text-muted mt-3 mb-0' }, label),
  ]);
}

/** Friendly empty / error state block. */
export function emptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message = '', action = null }) {
  return el('div', { class: 'text-center py-5 my-4' }, [
    el('div', { class: 'display-4 text-muted mb-2' }, [el('i', { class: `bi ${icon}` })]),
    el('h4', { class: 'fw-bold' }, title),
    message ? el('p', { class: 'text-muted' }, message) : null,
    action,
  ]);
}
