import { supabase } from '../supabaseClient.js';

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCategory({ name, slug, icon, color }) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, icon, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
