// Eventide — application entry point.
// Bootstrap CSS/JS + icons are bundled by Vite so there are no CDN dependencies.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/theme.css';
import './styles/main.css';

// Verify Supabase is configured (throws with a friendly message if not).
import './supabaseClient.js';

// Router, navbar and pages are wired up in the next commit. For now we render a
// themed landing so the scaffold runs with `npm run dev`.
const app = document.getElementById('app');
app.innerHTML = `
  <main class="container py-5 text-center ev-page">
    <h1 class="display-3 fw-bold text-gradient">Eventide</h1>
    <p class="lead text-muted">Discover &amp; host community events.</p>
    <span class="chip"><i class="bi bi-stars"></i> Setup in progress</span>
  </main>
`;
