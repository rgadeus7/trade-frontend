'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Rate limiting for magic link requests
  const [lastMagicLinkRequest, setLastMagicLinkRequest] = useState<number>(0)
  const MAGIC_LINK_COOLDOWN = 60000 // 1 minute cooldown

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error)
        } else if (session) {
          setSession(session)
          setUser(session.user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session?.user)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Send magic link with rate limiting and security
  const sendMagicLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check
      const now = Date.now()
      if (now - lastMagicLinkRequest < MAGIC_LINK_COOLDOWN) {
        const remainingTime = Math.ceil((MAGIC_LINK_COOLDOWN - (now - lastMagicLinkRequest)) / 1000)
        return {
          success: false,
          error: `Please wait ${remainingTime} seconds before requesting another link`
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        }
      }

      // Store email in localStorage for convenience
      localStorage.setItem('userEmail', email)
      
      // Update rate limiting timestamp
      setLastMagicLinkRequest(now)

      // Send magic link with secure options
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true, // Allow new users to sign up
        }
      })

      if (error) {
        console.error('Magic link error:', error)
        return {
          success: false,
          error: error.message || 'Failed to send login link'
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Unexpected error sending magic link:', error)
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      }
    }
  }, [lastMagicLinkRequest])

  // Sign out with cleanup
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Clear local storage
      localStorage.removeItem('userEmail')
      // Reset state
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh error:', error)
        // If refresh fails, sign out
        await signOut()
      } else if (session) {
        setSession(session)
        setUser(session.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
      await signOut()
    }
  }, [signOut])

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    sendMagicLink,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
