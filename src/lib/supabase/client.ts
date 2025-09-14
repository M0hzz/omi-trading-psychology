// src/lib/supabase/client.ts
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createSupabaseClient = () => {
  const client = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  
  // The realtime functionality is now accessed differently
  // We can add this if you need real-time updates
  // client.channel('ai-chat-changes')
  //   .on('postgres_changes', 
  //     { event: '*', schema: 'public', table: 'ai_chat_sessions' }, 
  //     (payload) => {
  //       console.log('Change received!', payload)
  //     }
  //   )
  //   .subscribe()
  
  return client
}