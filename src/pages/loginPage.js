import { el } from '../utils/dom.js';
import { login } from '../services/authService.js';
import { getSession } from '../session.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export async function render() {
  // Already logged in? Send them home.
  if (getSession().user) {
    navigateTo('/');
    return el('div');
  }

  const page = el('div', { class: 'container min-vh-content' });
  page.innerHTML = `
    <div class="card ev-auth-card p-4 p-md-5">
      <div class="text-center mb-4">
        <div class="display-6 text-gradient"><i class="bi bi-calendar2-heart-fill"></i></div>
        <h1 class="h3 fw-bold mb-1">Welcome back</h1>
        <p class="text-muted mb-0">Log in to host events and RSVP.</p>
      </div>
      <form id="login-form" novalidate>
        <div class="mb-3">
          <label class="form-label" for="email">Email</label>
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-envelope"></i></span>
            <input type="email" class="form-control" id="email" required autocomplete="email" placeholder="you@example.com">
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="password">Password</label>
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-lock"></i></span>
            <input type="password" class="form-control" id="password" required autocomplete="current-password" placeholder="••••••••">
          </div>
        </div>
        <div class="alert alert-danger py-2 d-none" id="login-error"></div>
        <button type="submit" class="btn btn-gradient w-100 py-2" id="login-submit">
          <i class="bi bi-box-arrow-in-right me-1"></i> Log in
        </button>
      </form>
      <p class="text-center text-muted mt-4 mb-0">
        New to Eventide? <a href="#/register" class="fw-semibold">Create an account</a>
      </p>
    </div>`;

  const form = page.querySelector('#login-form');
  const errorBox = page.querySelector('#login-error');
  const submitBtn = page.querySelector('#login-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');

    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) {
      showError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showToast('Welcome back!', 'success');
      navigateTo('/');
    } catch (err) {
      showError(err?.message || 'Invalid email or password.');
      setLoading(false);
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
  }
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner-border spinner-border-sm me-1"></span> Logging in…'
      : '<i class="bi bi-box-arrow-in-right me-1"></i> Log in';
  }

  return page;
}
