import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export async function insertNewUser(
  supabase: SupabaseClient<Database>,
  id: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.from('users').insert({
    id: id,
    email: email,
    status: 'pending'
  }).select();

  if (error) {
    console.error('Error inserting new user:', error);
    return { success: false, error: error.message };
  }

  if (data && data.length > 0) {

      return { success: true };
  } else {
      return { success: false, error: "No data returned after inserting user" };
  }
}
