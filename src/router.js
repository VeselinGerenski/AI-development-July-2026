// Minimal hash-based client-side router.
// Each route maps a path pattern (e.g. "/events/:id") to an async render function
// that returns an HTMLElement. Query strings are parsed and passed through.
import { spinner } from './components/spinner.js';
import { el } from './utils/dom.js';

let routes = [];
let notFoundRender = null;
let outlet = null;
let afterNavigate = null;

/**
 * @param {{ path: string, render: (ctx: {params: object, query: object}) => Promise<HTMLElement>|HTMLElement }[]} routeDefs
 * @param {{ outlet: HTMLElement, notFound?: Function, afterNavigate?: Function }} options
 */
export function initRouter(routeDefs, options) {
  routes = routeDefs;
  outlet = options.outlet;
  notFoundRender = options.notFound;
  afterNavigate = options.afterNavigate;

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

/** Programmatic navigation. */
export function navigateTo(path) {
  if (getHashPath() === path) handleRoute();
  else window.location.hash = path;
}

/** Current path portion of the hash (without query), always starting with "/". */
export function getHashPath() {
  const raw = window.location.hash.slice(1) || '/';
  return raw.split('?')[0] || '/';
}

function parseQuery() {
  const raw = window.location.hash.slice(1);
  const qIndex = raw.indexOf('?');
  const query = {};
  if (qIndex === -1) return query;
  const search = new URLSearchParams(raw.slice(qIndex + 1));
  for (const [k, v] of search.entries()) query[k] = v;
  return query;
}

function matchRoute(path) {
  for (const route of routes) {
    const params = matchPattern(route.path, path);
    if (params) return { route, params };
  }
  return null;
}

function matchPattern(pattern, path) {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

async function handleRoute() {
  const path = getHashPath();
  const query = parseQuery();
  const match = matchRoute(path);

  // Show a spinner immediately for responsiveness.
  outlet.replaceChildren(spinner());
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  try {
    let view;
    if (match) {
      view = await match.route.render({ params: match.params, query });
    } else if (notFoundRender) {
      view = await notFoundRender();
    } else {
      view = el('div', { class: 'container py-5 text-center' }, 'Page not found');
    }
    const main = el('main', { class: 'ev-page' }, view);
    outlet.replaceChildren(main);
  } catch (err) {
    console.error('Route render error:', err);
    outlet.replaceChildren(
      el('main', { class: 'container py-5 text-center' }, [
        el('h2', { class: 'fw-bold' }, 'Something went wrong'),
        el('p', { class: 'text-muted' }, err?.message || 'Unexpected error.'),
      ])
    );
  }

  if (afterNavigate) afterNavigate(path);
}
