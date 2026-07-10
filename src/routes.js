// Central route table: path pattern → page module render function.
// Pages are lazily imported so each screen stays in its own file and only the
// current screen's code path runs. New screens are registered here as they land.
export const routes = [
  { path: '/', render: (ctx) => import('./pages/homePage.js').then((m) => m.render(ctx)) },
];
