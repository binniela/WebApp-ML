"use client"

import { useState, useEffect } from "react"
import LoginPage from "./components/LoginPage"
import MessagingApp from "./components/MessagingApp"
import { CryptoManager } from "@/lib/crypto"

export default function SecureChatApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ username: string; publicKey: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const crypto = CryptoManager.getInstance()

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem('lockbox-token')
        const savedUser = localStorage.getItem('lockbox-user')
        
        if (token && savedUser) {
          // Verify token is still valid
          const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ path: '/auth/verify/' + token.split('.')[1] })
          })
          
          if (response.ok) {
            const userData = JSON.parse(savedUser)
            
            // Generate temporary keys for session (in production, load from secure storage)
            const keys = crypto.generateKeyPairs()
            
            setUser({
              username: userData.username,
              publicKey: keys.kyber.publicKey
            })
            setIsAuthenticated(true)
          } else {
            // Token expired, clear session
            localStorage.removeItem('lockbox-token')
            localStorage.removeItem('lockbox-user')
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        // Clear invalid session
        localStorage.removeItem('lockbox-token')
        localStorage.removeItem('lockbox-user')
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const handleLogin = (userData: { username: string; publicKey: string }) => {
    // Save user data to localStorage for session persistence
    localStorage.setItem('lockbox-user', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('lockbox-token')
    localStorage.removeItem('lockbox-user')
    setUser(null)
    setIsAuthenticated(false)
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

  return <MessagingApp user={user} onLogout={handleLogout} />
}