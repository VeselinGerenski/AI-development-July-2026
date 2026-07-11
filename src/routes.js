// Central route table: path pattern → page module render function.
// Pages are lazily imported so each screen stays in its own file and only the
// current screen's code path runs. New screens are registered here as they land.
export const routes = [
  { path: '/', render: (ctx) => import('./pages/homePage.js').then((m) => m.render(ctx)) },
  { path: '/login', render: (ctx) => import('./pages/loginPage.js').then((m) => m.render(ctx)) },
  { path: '/register', render: (ctx) => import('./pages/registerPage.js').then((m) => m.render(ctx)) },
  { path: '/events/new', render: (ctx) => import('./pages/createEventPage.js').then((m) => m.render(ctx)) },
  { path: '/events/:id', render: (ctx) => import('./pages/eventDetailPage.js').then((m) => m.render(ctx)) },
  { path: '/events/:id/edit', render: (ctx) => import('./pages/editEventPage.js').then((m) => m.render(ctx)) },
  { path: '/dashboard', render: (ctx) => import('./pages/dashboardPage.js').then((m) => m.render(ctx)) },
];
