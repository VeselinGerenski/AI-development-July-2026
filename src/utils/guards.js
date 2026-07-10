// Route guards used inside page render() functions. They redirect and return
// false when access is denied, so a page can early-return an empty node.
import { getSession } from '../session.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';

export function requireAuth() {
  const session = getSession();
  if (!session.user) {
    showToast('Please log in to continue.', 'info');
    navigateTo('/login');
    return false;
  }
  return true;
}

export function requireAdmin() {
  const session = getSession();
  if (!session.user) {
    showToast('Please log in to continue.', 'info');
    navigateTo('/login');
    return false;
  }
  if (!session.isAdmin) {
    showToast('Admins only.', 'error');
    navigateTo('/');
    return false;
  }
  return true;
}
