// Global session store. Holds the current user, their profile and admin flag,
// and notifies subscribers (navbar, guards) whenever auth state changes.
import * as auth from './services/authService.js';

const state = {
  user: null,
  profile: null,
  isAdmin: false,
  ready: false,
};

const listeners = new Set();

export function getSession() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

async function hydrate(user) {
  state.user = user;
  if (user) {
    const [profile, role] = await Promise.all([
      auth.getProfile(user.id).catch(() => null),
      auth.getRole(user.id).catch(() => 'user'),
    ]);
    state.profile = profile;
    state.isAdmin = role === 'admin';
  } else {
    state.profile = null;
    state.isAdmin = false;
  }
  state.ready = true;
  emit();
}

/** Refresh the profile from the DB (e.g. after editing it). */
export async function refreshProfile() {
  if (state.user) {
    state.profile = await auth.getProfile(state.user.id).catch(() => state.profile);
    emit();
  }
}

/** Initialize the store: load the current session and listen for changes. */
export async function initSession() {
  const session = await auth.getSession();
  await hydrate(session?.user ?? null);
  auth.onAuthStateChange(async (_event, session) => {
    await hydrate(session?.user ?? null);
  });
}
