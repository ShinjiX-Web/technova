import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

// Presence status types matching MS Teams
export type PresenceStatus = 'Online' | 'Away' | 'Offline'

// Time thresholds
const AWAY_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes of inactivity = Away
const HEARTBEAT_INTERVAL_MS = 30 * 1000  // Update presence every 30 seconds

export function usePresence() {
  const { user } = useAuth()
  const lastActivityRef = useRef<number>(Date.now())
  const statusRef = useRef<PresenceStatus>('Online')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (statusRef.current !== 'Online') {
      statusRef.current = 'Online'
      updatePresenceInDb('Online')
    }
  }, [])

  // Update presence in database
  const updatePresenceInDb = useCallback(async (status: PresenceStatus) => {
    if (!user?.id) return

    try {
      // Update team_members table for entries where user is a member (user_id matches)
      const { error: memberError } = await supabase
        .from('team_members')
        .update({
          status: status === 'Online' ? 'Active' : status,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id)

      // Also update team_members entries where user is the owner
      const { error: ownerError } = await supabase
        .from('team_members')
        .update({
          last_seen: new Date().toISOString()
        })
        .eq('owner_id', user.id)
        .eq('email', user.email || '')

      // Log errors but don't throw - user might not have any team_members entries yet
      if (memberError) console.log('Member presence update:', memberError.message)
      if (ownerError) console.log('Owner presence update:', ownerError.message)
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }, [user?.id, user?.email])

  // Check if user should be marked as Away
  const checkIdleStatus = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current
    
    if (timeSinceActivity >= AWAY_TIMEOUT_MS && statusRef.current === 'Online') {
      statusRef.current = 'Away'
      updatePresenceInDb('Away')
    }
  }, [updatePresenceInDb])

  // Set up presence tracking
  useEffect(() => {
    if (!user?.id) return

    // Initial presence update
    updatePresenceInDb('Online')

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    // Throttled activity handler
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null
    const throttledUpdateActivity = () => {
      if (!throttleTimeout) {
        updateActivity()
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
        }, 1000) // Throttle to once per second
      }
    }

    events.forEach(event => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true })
    })

    // Set up heartbeat interval
    intervalRef.current = setInterval(() => {
      checkIdleStatus()
      // Send heartbeat if still online
      if (statusRef.current === 'Online') {
        updatePresenceInDb('Online')
      }
    }, HEARTBEAT_INTERVAL_MS)

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, will go away after timeout
      } else {
        // Tab is visible again, mark as online
        updateActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)



    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdateActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }

      // Mark as offline when unmounting
      updatePresenceInDb('Offline')
    }
  }, [user?.id, updateActivity, checkIdleStatus, updatePresenceInDb])

  return {
    updateActivity,
    currentStatus: statusRef.current
  }
}

