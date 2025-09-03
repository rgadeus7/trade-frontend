'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const { sendMagicLink } = useAuth()

  // Auto-fill email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await sendMagicLink(email)
      
      if (result.success) {
        setMessage('✅ Check your email for the secure login link!')
        setCountdown(60) // Start 60 second countdown
      } else {
        setMessage(`❌ ${result.error}`)
        if (result.error?.includes('wait')) {
          // Extract wait time and set countdown
          const waitMatch = result.error.match(/(\d+)/)
          if (waitMatch) {
            setCountdown(parseInt(waitMatch[1]))
          }
        }
      }
    } catch (err) {
      setMessage('❌ An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isButtonDisabled = loading || countdown > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Trading Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Secure access to your market data
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('✅') 
                  ? 'bg-green-500/20 text-green-200 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-200 border border-red-500/30'
              }`}>
                {message}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg transition-all duration-200 ${
                isButtonDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </div>
              ) : countdown > 0 ? (
                `Wait ${countdown}s before next request`
              ) : (
                'Send Secure Login Link'
              )}
            </button>
          </form>
        </div>

        {/* Security Features Info */}
        <div className="text-center text-xs text-gray-400 space-y-2">
          <p>🔒 Rate limited to prevent abuse</p>
          <p>📧 One-time use secure links</p>
          <p>⏰ Sessions last for extended periods</p>
        </div>
      </div>
    </div>
  )
}
