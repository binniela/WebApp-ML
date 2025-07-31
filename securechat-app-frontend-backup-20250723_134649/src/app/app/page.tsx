"use client"

import { useState, useEffect } from "react"
import LoginPage from "./components/LoginPage"
import MessagingApp from "./components/MessagingApp"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { CryptoManager } from "@/lib/crypto"

export default function SecureChatApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ username: string; publicKey: string; userId: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const crypto = CryptoManager.getInstance()

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem('lockbox-token')
        const savedUser = localStorage.getItem('lockbox-user')
        
        if (token && savedUser) {
          // Skip token verification for faster startup - just restore session
          const userData = JSON.parse(savedUser)
          
          // Validate userData
          if (!userData || !userData.username || typeof userData.username !== 'string') {
            throw new Error('Invalid user data')
          }
          
          // Generate temporary keys for session
          const keys = crypto.generateKeyPairs()
          
          const userId = localStorage.getItem('lockbox-user-id') || 'temp-id'
          
          setUser({
            username: String(userData.username),
            publicKey: keys.kyber.publicKey,
            userId: userId
          })
          setIsAuthenticated(true)
          
          console.log('Session restored for user:', userData.username)
        }
      } catch (error) {
        console.error('Session check failed:', error)
        setHasError(true)
        // Clear invalid session
        localStorage.removeItem('lockbox-token')
        localStorage.removeItem('lockbox-user')
        localStorage.removeItem('lockbox-user-id')
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const handleLogin = (userData: { username: string; publicKey: string; userId: string }) => {
    // Save user data to localStorage for session persistence
    localStorage.setItem('lockbox-user', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('lockbox-token')
    localStorage.removeItem('lockbox-user')
    localStorage.removeItem('lockbox-user-id')
    localStorage.removeItem('lockbox-contacts')
    localStorage.removeItem('lockbox-messages')
    setUser(null)
    setIsAuthenticated(false)
  }

  // Show error screen if there's an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Application Error</h2>
          <p className="text-zinc-400 mb-4">Please refresh the page to try again</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-black px-4 py-2 rounded hover:bg-zinc-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading LockBox...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <ErrorBoundary>
      <MessagingApp user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  )
}