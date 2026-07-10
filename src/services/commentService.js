import { supabase } from '../supabaseClient.js';

const COMMENT_SELECT = '*, user:profiles!comments_user_id_fkey(id, username, avatar_url)';

export async function listComments(eventId) {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(eventId, userId, body) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ event_id: eventId, user_id: userId, body })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
