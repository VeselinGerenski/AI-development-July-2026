// Eventide — application entry point.
// Bootstrap CSS/JS + icons are bundled by Vite so there are no CDN dependencies.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/theme.css';
import './styles/main.css';

import './supabaseClient.js'; // validates configuration early
import { initRouter, navigateTo } from './router.js';
import { routes } from './routes.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { showToast } from './components/toast.js';
import { el } from './utils/dom.js';
import { initSession, getSession, subscribe } from './session.js';
import { logout } from './services/authService.js';

const app = document.getElementById('app');

// Layout: navbar host · router outlet · footer.
const navbarHost = el('div', { id: 'navbar-host' });
const outlet = el('div', { class: 'ev-outlet' });
const footer = renderFooter();
app.replaceChildren(navbarHost, outlet, footer);

async function handleLogout() {
  try {
    await logout();
    showToast('You have been signed out.', 'success');
    navigateTo('/');
  } catch (err) {
    showToast(err?.message || 'Could not sign out.', 'error');
  }
}

function mountNavbar() {
  navbarHost.replaceChildren(renderNavbar(getSession(), { onLogout: handleLogout }));
}

// Re-render the navbar whenever auth state changes.
subscribe(() => mountNavbar());

// Boot: load the session before starting the router so guards see the real state.
(async () => {
  await initSession();
  mountNavbar();
  initRouter(routes, {
    outlet,
    notFound: () => import('./pages/notFoundPage.js').then((m) => m.render()),
    afterNavigate: () => mountNavbar(), // refresh active-link highlighting
  });
})();
