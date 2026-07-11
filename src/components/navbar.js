import { el, escapeHtml } from '../utils/dom.js';
import { getHashPath } from '../router.js';

/**
 * Render the top navigation bar.
 * @param {{ user: object|null, profile: object|null, isAdmin: boolean }} session
 * @param {{ onLogout: Function }} handlers
 */
export function renderNavbar(session, handlers = {}) {
  const current = getHashPath();
  const isActive = (path) => (current === path ? 'active fw-semibold' : '');

  const guestLinks = `
    <li class="nav-item"><a class="nav-link ${isActive('/login')}" href="#/login">Log in</a></li>
    <li class="nav-item ms-lg-2">
      <a class="btn btn-gradient btn-sm px-3" href="#/register">Sign up</a>
    </li>`;

  const name = session.profile?.username || session.user?.email?.split('@')[0] || 'Account';
  const avatar = session.profile?.avatar_url;
  const avatarMarkup = avatar
    ? `<img src="${escapeHtml(avatar)}" alt="" width="30" height="30" class="rounded-circle object-fit-cover me-1" style="object-fit:cover">`
    : `<span class="d-inline-flex align-items-center justify-content-center rounded-circle bg-gradient-brand text-white me-1" style="width:30px;height:30px;font-size:.8rem;">${escapeHtml(name[0]?.toUpperCase() || 'U')}</span>`;

  const authedLinks = `
    <li class="nav-item"><a class="nav-link ${isActive('/events/new')}" href="#/events/new">
      <i class="bi bi-plus-circle me-1"></i>Create</a></li>
    <li class="nav-item"><a class="nav-link ${isActive('/dashboard')}" href="#/dashboard">My Events</a></li>
    ${session.isAdmin ? `<li class="nav-item"><a class="nav-link ${isActive('/admin')}" href="#/admin"><i class="bi bi-shield-lock me-1"></i>Admin</a></li>` : ''}
    <li class="nav-item dropdown ms-lg-2">
      <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button"
         data-bs-toggle="dropdown" aria-expanded="false">
        ${avatarMarkup}<span>${escapeHtml(name)}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end shadow border-0">
        <li><a class="dropdown-item" href="#/profile"><i class="bi bi-person me-2"></i>Profile</a></li>
        <li><a class="dropdown-item" href="#/dashboard"><i class="bi bi-calendar-event me-2"></i>My Events</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger" id="nav-logout"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
      </ul>
    </li>`;

  const nav = el('nav', { class: 'navbar navbar-expand-lg ev-navbar sticky-top py-2' });
  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand brand-logo d-flex align-items-center gap-2" href="#/">
        <i class="bi bi-calendar2-heart-fill text-gradient"></i>
        <span class="text-gradient">Eventide</span>
      </a>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse"
              data-bs-target="#nav-collapse" aria-controls="nav-collapse"
              aria-expanded="false" aria-label="Toggle navigation">
        <i class="bi bi-list fs-3"></i>
      </button>
      <div class="collapse navbar-collapse" id="nav-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link ${isActive('/')}" href="#/">Browse</a></li>
        </ul>
        <ul class="navbar-nav align-items-lg-center">
          ${session.user ? authedLinks : guestLinks}
        </ul>
      </div>
    </div>`;

  const logoutBtn = nav.querySelector('#nav-logout');
  if (logoutBtn && handlers.onLogout) {
    logoutBtn.addEventListener('click', handlers.onLogout);
  }

  // On mobile, collapse the menu after tapping any nav link.
  const collapseEl = nav.querySelector('#nav-collapse');
  nav.querySelectorAll('.nav-link, .dropdown-item, .navbar-brand, .btn').forEach((link) => {
    link.addEventListener('click', () => {
      if (collapseEl?.classList.contains('show')) {
        import('bootstrap').then(({ Collapse }) => Collapse.getOrCreateInstance(collapseEl).hide());
      }
    });
  });

  return nav;
}
