// Central Supabase client. Every service imports the client from here so there is
// a single source of truth for backend configuration.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly and early with a helpful message rather than a cryptic runtime error.
  document.body.innerHTML = `
    <div style="font-family: system-ui; max-width: 640px; margin: 4rem auto; padding: 2rem;
                border: 1px solid #f5c2c7; background: #f8d7da; color: #842029; border-radius: 12px;">
      <h2>⚠️ Supabase is not configured</h2>
      <p>Create a <code>.env</code> file in the project root (copy from
      <code>.env.example</code>) and set:</p>
      <pre>VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...</pre>
      <p>Then restart <code>npm run dev</code>.</p>
    </div>`;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
