// Auth service — the only module that talks to Supabase Auth and the profiles/
// user_roles tables for identity. Pages and the session store call through here.
import { supabase } from '../supabaseClient.js';

/** Register a new user. Username + full name are stored in user metadata and
 *  picked up by the handle_new_user() trigger to create the profile row. */
export async function register({ email, password, username, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? 'user';
}

/** Subscribe to auth state changes (login/logout/token refresh). */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}
