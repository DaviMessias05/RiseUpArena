import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { clearAllCache } from '../lib/cache'

const AuthContext = createContext(null)

const CACHE_KEY = 'rua_auth_cache'

function getCachedAuth() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    return JSON.parse(cached)
  } catch {
    return null
  }
}

function setCachedAuth(user, profile) {
  try {
    if (user && profile) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ user, profile }))
    } else {
      localStorage.removeItem(CACHE_KEY)
    }
  } catch {
    // Ignora erros de storage
  }
}

export function AuthProvider({ children }) {
  const cached = getCachedAuth()

  const [user, setUser] = useState(cached?.user ?? null)
  const [profile, setProfile] = useState(cached?.profile ?? null)
  const [session, setSession] = useState(null)
  // Se tem cache, não mostra loading
  const [loading, setLoading] = useState(!cached)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      setProfile(null)
      setCachedAuth(null, null)
      return null
    }

    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error.message)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setCachedAuth(null, null)
          }
          return
        }

        if (!mounted) return

        setSession(currentSession)
        const currentUser = currentSession?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id)
          if (mounted) {
            setCachedAuth(currentUser, profileData)
          }
        } else {
          setProfile(null)
          setCachedAuth(null, null)
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return
        // INITIAL_SESSION is handled by initializeAuth() above — skip to avoid double fetchProfile
        if (event === 'INITIAL_SESSION') return

        setSession(newSession)
        const newUser = newSession?.user ?? null
        setUser(newUser)

        if (newUser) {
          const profileData = await fetchProfile(newUser.id)
          if (mounted) setCachedAuth(newUser, profileData)
        } else {
          setProfile(null)
          setCachedAuth(null, null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = useCallback(async (email, password, username, fullName, cpf) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          cpf,
        },
      },
    })

    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })

    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    setUser(null)
    setProfile(null)
    setSession(null)
    setCachedAuth(null, null)
    clearAllCache()
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key)
      }
    }
    try {
      await supabase.auth.signOut()
    } catch (err) {
      // Ignora erros - tokens já foram limpos
    }
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
    setCachedAuth(user, data)
    return data
  }, [user])

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin'
  }, [profile])

  const isEmailVerified = useMemo(() => {
    return !!user?.email_confirmed_at || profile?.email_verified === true
  }, [user, profile])

  const isProfileComplete = useMemo(() => {
    if (!user) return null
    if (!profile) return null
    return !!profile.cpf
  }, [user, profile])

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    isAdmin,
    isEmailVerified,
    isProfileComplete,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    fetchProfile,
  }), [
    user,
    profile,
    session,
    loading,
    isAdmin,
    isEmailVerified,
    isProfileComplete,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    fetchProfile,
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
