// Lightweight toast notifications built on Bootstrap's toast component.
import { Toast } from 'bootstrap';

const ICONS = {
  success: 'bi-check-circle-fill text-success',
  error: 'bi-exclamation-triangle-fill text-danger',
  info: 'bi-info-circle-fill text-primary',
  warning: 'bi-exclamation-circle-fill text-warning',
};

/**
 * Show a toast message.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'toast align-items-center border-0 shadow';
  wrapper.setAttribute('role', 'alert');
  wrapper.setAttribute('aria-live', 'assertive');
  wrapper.setAttribute('aria-atomic', 'true');
  wrapper.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${ICONS[type] || ICONS.info}"></i>
        <span></span>
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  // Use textContent to avoid injecting markup from message strings.
  wrapper.querySelector('span').textContent = message;

  container.appendChild(wrapper);
  const toast = new Toast(wrapper, { delay: 4000 });
  toast.show();
  wrapper.addEventListener('hidden.bs.toast', () => wrapper.remove());
}
