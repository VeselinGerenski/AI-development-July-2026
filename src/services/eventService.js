// Event service — all reads/writes for events go through here.
import { supabase } from '../supabaseClient.js';

// Shared select with related category, organizer and RSVP count.
const EVENT_SELECT = `
  id, title, description, banner_url, location, event_date, capacity, status, created_at, category_id, organizer_id,
  category:categories(id, name, slug, icon, color),
  organizer:profiles!events_organizer_id_fkey(id, username, full_name, avatar_url),
  rsvps(count)
`;

function normalize(event) {
  if (!event) return event;
  return { ...event, rsvpCount: event.rsvps?.[0]?.count ?? 0 };
}

/**
 * List approved events for public browsing.
 * @param {{ categoryId?: string, search?: string, upcomingOnly?: boolean }} opts
 */
export async function listEvents({ categoryId = null, search = '', upcomingOnly = true } = {}) {
  let query = supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'approved')
    .order('event_date', { ascending: true });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (upcomingOnly) query = query.gte('event_date', new Date().toISOString());
  if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalize);
}

/** A single event with relations (respects RLS visibility). */
export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return normalize(data);
}

/** Events created by a given organizer (any status — RLS lets owners see own). */
export async function listByOrganizer(userId) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('organizer_id', userId)
    .order('event_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
