import { supabase } from '../supabaseClient.js';

export async function getMyRsvp(eventId, userId) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setRsvp(eventId, userId, status) {
  const { data, error } = await supabase
    .from('rsvps')
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeRsvp(eventId, userId) {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function listAttendees(eventId, limit = 16) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('status, created_at, user:profiles!rsvps_user_id_fkey(id, username, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** RSVPs for the current user (used by the dashboard). */
export async function listMyRsvps(userId) {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      status, created_at,
      event:events!rsvps_event_id_fkey(
        id, title, banner_url, location, event_date, status,
        category:categories(name, icon, color)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).filter((r) => r.event);
}
