import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      setProfile(null)
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
          return
        }

        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
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

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }

        if (event === 'INITIAL_SESSION') {
          setLoading(false)
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
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error signing out:', err.message)
    }
    // Garante limpeza do token mesmo se signOut falhar
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    localStorage.removeItem(storageKey)
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

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin'
  }, [profile])

  const isEmailVerified = useMemo(() => {
    return !!user?.email_confirmed_at || profile?.email_verified === true
  }, [user, profile])

  const isProfileComplete = useMemo(() => {
    if (!profile) return false
    return !!profile.cpf
  }, [profile])

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
