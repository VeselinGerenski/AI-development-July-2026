// Eventide — application entry point.
// Bootstrap CSS/JS + icons are bundled by Vite so there are no CDN dependencies.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/theme.css';
import './styles/main.css';

import './supabaseClient.js'; // validates configuration early
import { initRouter } from './router.js';
import { routes } from './routes.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { el } from './utils/dom.js';

const app = document.getElementById('app');

// Layout: navbar host · router outlet · footer.
const navbarHost = el('div', { id: 'navbar-host' });
const outlet = el('div', { class: 'ev-outlet' });
const footer = renderFooter();
app.replaceChildren(navbarHost, outlet, footer);

// Auth wiring lands in the auth commit; for now render the guest navbar.
// A single `currentSession` is the source of truth the navbar re-reads on navigation.
const currentSession = { user: null, profile: null, isAdmin: false };

function mountNavbar() {
  navbarHost.replaceChildren(renderNavbar(currentSession, { onLogout: () => {} }));
}
mountNavbar();

initRouter(routes, {
  outlet,
  notFound: () => import('./pages/notFoundPage.js').then((m) => m.render()),
  afterNavigate: () => mountNavbar(), // refresh active-link highlighting
});
