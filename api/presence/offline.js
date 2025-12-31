import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id, status } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' })
    }

    // Update the user's presence status
    await supabase
      .from('team_members')
      .update({ 
        status: status || 'Offline',
        last_seen: new Date().toISOString()
      })
      .eq('user_id', user_id)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating offline status:', error)
    return res.status(500).json({ error: 'Failed to update status' })
  }
}

