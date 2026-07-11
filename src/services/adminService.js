// Admin service — privileged reads/writes. Every call is still enforced by RLS
// server-side (is_admin()), so a non-admin calling these simply gets nothing / an error.
import { supabase } from '../supabaseClient.js';

const ADMIN_EVENT_SELECT = `
  id, title, description, banner_url, location, event_date, status, created_at,
  category:categories(name, icon, color),
  organizer:profiles!events_organizer_id_fkey(username, avatar_url)
`;

/** All events (optionally filtered by status), newest first. */
export async function listEventsForModeration(status = null) {
  let query = supabase
    .from('events')
    .select(ADMIN_EVENT_SELECT)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function setEventStatus(id, status) {
  const { data, error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

/** All users with their role (profiles + user_roles merged client-side). */
export async function listUsers() {
  const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
    supabase.from('profiles').select('id, username, full_name, avatar_url, created_at').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  return (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? 'user' }));
}

export async function setUserRole(userId, role) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Dashboard counts for the admin overview. */
export async function getStats() {
  const count = async (table, filter) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count: c } = await q;
    return c ?? 0;
  };
  const [events, pending, users, categories] = await Promise.all([
    count('events'),
    count('events', (q) => q.eq('status', 'pending')),
    count('profiles'),
    count('categories'),
  ]);
  return { events, pending, users, categories };
}
