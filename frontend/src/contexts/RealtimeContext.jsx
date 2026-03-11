import { createContext, useContext, useRef, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const RealtimeContext = createContext(null)

export function RealtimeProvider({ children }) {
  const channelsRef = useRef(new Map())

  const unsubscribe = useCallback((channelName) => {
    const channel = channelsRef.current.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      channelsRef.current.delete(channelName)
    }
  }, [])

  const subscribeLobby = useCallback((lobbyId, callback) => {
    const channelName = `lobby:${lobbyId}`

    const existing = channelsRef.current.get(channelName)
    if (existing) {
      supabase.removeChannel(existing)
      channelsRef.current.delete(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`,
        },
        (payload) => {
          callback({
            table: 'lobbies',
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          callback({
            table: 'lobby_players',
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          })
        }
      )
      .subscribe((status, err) => {
        if (err) {
          if (import.meta.env.DEV) console.error(`Realtime subscription error for ${channelName}:`, err)
        }
      })

    channelsRef.current.set(channelName, channel)

    return () => unsubscribe(channelName)
  }, [unsubscribe])

  const subscribeChat = useCallback((channelType, channelId, callback) => {
    const channelName = `chat:${channelType}:${channelId}`

    const existing = channelsRef.current.get(channelName)
    if (existing) {
      supabase.removeChannel(existing)
      channelsRef.current.delete(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_type=eq.${channelType}`,
        },
        (payload) => {
          if (payload.new.channel_id === channelId) {
            callback({
              eventType: 'INSERT',
              message: payload.new,
            })
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          if (import.meta.env.DEV) console.error(`Realtime subscription error for ${channelName}:`, err)
        }
      })

    channelsRef.current.set(channelName, channel)

    return () => unsubscribe(channelName)
  }, [unsubscribe])

  const subscribeMatch = useCallback((matchId, callback) => {
    const channelName = `match:${matchId}`

    const existing = channelsRef.current.get(channelName)
    if (existing) {
      supabase.removeChannel(existing)
      channelsRef.current.delete(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          })
        }
      )
      .subscribe((status, err) => {
        if (err) {
          if (import.meta.env.DEV) console.error(`Realtime subscription error for ${channelName}:`, err)
        }
      })

    channelsRef.current.set(channelName, channel)

    return () => unsubscribe(channelName)
  }, [unsubscribe])

  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      channelsRef.current.clear()
    }
  }, [])

  const value = useMemo(() => ({
    subscribeLobby,
    subscribeChat,
    subscribeMatch,
    unsubscribe,
  }), [subscribeLobby, subscribeChat, subscribeMatch, unsubscribe])

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
