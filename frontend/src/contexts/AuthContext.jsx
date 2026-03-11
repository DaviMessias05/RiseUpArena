import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { clearAllCache } from '../lib/cache'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching profile:', error.message)
        return null
      }
      return data
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchProfile exception:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Safety timeout: if auth never initializes, stop loading
    const timeout = setTimeout(() => {
      if (mounted) {
        if (import.meta.env.DEV) console.warn('Auth init timeout — forcing load complete')
        setLoading(false)
      }
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        // SIGNED_OUT: clear everything
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !newSession)) {
          setUser(null)
          setProfile(null)
          setSession(null)
          clearAllCache()
          setLoading(false)
          return
        }

        // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED: update state
        setSession(newSession)
        const newUser = newSession?.user ?? null
        setUser(newUser)

        if (newUser) {
          const profileData = await fetchProfile(newUser.id)
          if (mounted) setProfile(profileData)
        } else {
          setProfile(null)
        }

        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = useCallback(async (email, password, username, fullName, cpf) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName, cpf },
      },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    setUser(null)
    setProfile(null)
    setSession(null)
    clearAllCache()
    try {
      await supabase.auth.signOut()
    } catch {}
    try { localStorage.clear() } catch {}
    try { sessionStorage.clear() } catch {}
    window.location.href = '/'
  }, [])

  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('No authenticated user')

    const ALLOWED_FIELDS = ['display_name', 'bio', 'avatar_url']
    const safeUpdates = {}
    for (const key of ALLOWED_FIELDS) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key]
    }
    if (Object.keys(safeUpdates).length === 0) {
      throw new Error('No valid fields to update')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }, [user])

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile])
  const isEmailVerified = useMemo(() => !!user?.email_confirmed_at || profile?.email_verified === true, [user, profile])
  const isProfileComplete = useMemo(() => {
    if (!user || !profile) return null
    return !!profile.cpf
  }, [user, profile])

  const value = useMemo(() => ({
    user, profile, session, loading,
    isAdmin, isEmailVerified, isProfileComplete,
    signUp, signIn, signInWithGoogle, signOut,
    updateProfile, fetchProfile,
  }), [
    user, profile, session, loading,
    isAdmin, isEmailVerified, isProfileComplete,
    signUp, signIn, signInWithGoogle, signOut,
    updateProfile, fetchProfile,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
