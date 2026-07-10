// Eventide — application entry point.
// Bootstrap CSS/JS + icons are bundled by Vite so there are no CDN dependencies.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.css';

// Router, navbar and pages are added in subsequent commits. For now we render a
// simple landing so the scaffold runs with `npm run dev`.
const app = document.getElementById('app');
app.innerHTML = `
  <main class="container py-5 text-center">
    <h1 class="display-4 fw-bold">Eventide</h1>
    <p class="lead text-muted">Discover &amp; host community events. (Scaffolding in progress…)</p>
  </main>
`;
