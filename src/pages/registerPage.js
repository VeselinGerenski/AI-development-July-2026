import { el } from '../utils/dom.js';
import { register } from '../services/authService.js';
import { getSession } from '../session.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export async function render() {
  if (getSession().user) {
    navigateTo('/');
    return el('div');
  }

  const page = el('div', { class: 'container min-vh-content' });
  page.innerHTML = `
    <div class="card ev-auth-card p-4 p-md-5">
      <div class="text-center mb-4">
        <div class="display-6 text-gradient"><i class="bi bi-calendar2-heart-fill"></i></div>
        <h1 class="h3 fw-bold mb-1">Join Eventide</h1>
        <p class="text-muted mb-0">Create an account to host and RSVP to events.</p>
      </div>
      <form id="register-form" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="username">Username</label>
            <input type="text" class="form-control" id="username" required minlength="3" maxlength="24" placeholder="janedoe">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="fullName">Full name</label>
            <input type="text" class="form-control" id="fullName" placeholder="Jane Doe">
          </div>
        </div>
        <div class="mt-3">
          <label class="form-label" for="email">Email</label>
          <input type="email" class="form-control" id="email" required autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="row g-3 mt-0">
          <div class="col-md-6">
            <label class="form-label" for="password">Password</label>
            <input type="password" class="form-control" id="password" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="confirm">Confirm password</label>
            <input type="password" class="form-control" id="confirm" required autocomplete="new-password" placeholder="Repeat password">
          </div>
        </div>
        <div class="alert alert-danger py-2 mt-3 d-none" id="register-error"></div>
        <button type="submit" class="btn btn-gradient w-100 py-2 mt-3" id="register-submit">
          <i class="bi bi-person-plus me-1"></i> Create account
        </button>
      </form>
      <p class="text-center text-muted mt-4 mb-0">
        Already have an account? <a href="#/login" class="fw-semibold">Log in</a>
      </p>
    </div>`;

  const form = page.querySelector('#register-form');
  const errorBox = page.querySelector('#register-error');
  const submitBtn = page.querySelector('#register-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');

    const username = form.username.value.trim();
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (username.length < 3) return showError('Username must be at least 3 characters.');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return showError('Username can only contain letters, numbers and underscores.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');
    if (password !== confirm) return showError('Passwords do not match.');

    setLoading(true);
    try {
      const data = await register({ email, password, username, fullName });
      if (data.session) {
        showToast('Account created — welcome!', 'success');
        navigateTo('/');
      } else {
        // Email confirmation is enabled on the project.
        showToast('Account created! Check your email to confirm.', 'info');
        navigateTo('/login');
      }
    } catch (err) {
      showError(err?.message || 'Could not create your account.');
      setLoading(false);
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
    return false;
  }
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="spinner-border spinner-border-sm me-1"></span> Creating account…'
      : '<i class="bi bi-person-plus me-1"></i> Create account';
  }

  return page;
}
