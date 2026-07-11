// Central route table: path pattern → page module render function.
// Pages are lazily imported so each screen stays in its own file and only the
// current screen's code path runs. New screens are registered here as they land.
export const routes = [
  { path: '/', title: 'Discover events', render: (ctx) => import('./pages/homePage.js').then((m) => m.render(ctx)) },
  { path: '/login', title: 'Log in', render: (ctx) => import('./pages/loginPage.js').then((m) => m.render(ctx)) },
  { path: '/register', title: 'Sign up', render: (ctx) => import('./pages/registerPage.js').then((m) => m.render(ctx)) },
  { path: '/events/new', title: 'Host an event', render: (ctx) => import('./pages/createEventPage.js').then((m) => m.render(ctx)) },
  { path: '/events/:id', title: 'Event', render: (ctx) => import('./pages/eventDetailPage.js').then((m) => m.render(ctx)) },
  { path: '/events/:id/edit', title: 'Edit event', render: (ctx) => import('./pages/editEventPage.js').then((m) => m.render(ctx)) },
  { path: '/dashboard', title: 'My Events', render: (ctx) => import('./pages/dashboardPage.js').then((m) => m.render(ctx)) },
  { path: '/profile', title: 'My Profile', render: (ctx) => import('./pages/profilePage.js').then((m) => m.render(ctx)) },
  { path: '/admin', title: 'Admin', render: (ctx) => import('./pages/adminPage.js').then((m) => m.render(ctx)) },
];
