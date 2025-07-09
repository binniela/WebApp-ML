"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, User, Send } from "lucide-react"

interface User {
  id: string
  username: string
  kyber_public_key: string | null
  mldsa_public_key: string | null
  created_at: string
}

interface NewChatModalProps {
  onClose: () => void
  onStartChat: (user: User) => void
  darkMode: boolean
}

export default function NewChatModal({ onClose, onStartChat, darkMode }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState("Hi! I'd like to start a secure conversation with you.")

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsLoading(true)
      try {
        const token = localStorage.getItem('lockbox-token')
        const response = await fetch(`http://10.201.154.21:8000/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const users = await response.json()
          setSearchResults(users)
        } else {
          console.error('Search failed')
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSendRequest = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('lockbox-token')
      const response = await fetch('http://10.201.154.21:8000/chat-requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: selectedUser.id,
          message: message
        })
      })

      if (response.ok) {
        // Create pending contact after successful request
        const pendingContact = {
          ...selectedUser,
          status: 'pending'
        } as any
        onStartChat(pendingContact)
        onClose()
      } else {
        const error = await response.json()
        alert(`Failed to send chat request: ${error.detail}`)
      }
    } catch (error) {
      console.error('Send request error:', error)
      alert('Failed to send chat request')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className={`w-full max-w-md ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Start New Chat</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!selectedUser ? (
            <>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search users by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-gray-50 border-gray-300'}`}
                />
              </div>

              {/* Search Results */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-center py-4 text-zinc-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        darkMode 
                          ? 'hover:bg-zinc-800 border border-zinc-700' 
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.username}</p>
                          <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {user.kyber_public_key ? 'Quantum-safe keys available' : 'No encryption keys'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-4 text-zinc-400">
                    No users found
                  </div>
                ) : (
                  <div className="text-center py-4 text-zinc-400">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected User */}
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.username}</p>
                    <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Send chat request
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedUser(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Introduction Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a brief introduction..."
                  className={`w-full p-3 rounded-lg resize-none h-20 ${
                    darkMode 
                      ? 'bg-zinc-800 border-zinc-600 text-white' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUser(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSendRequest}
                  className="flex-1 bg-white text-black hover:bg-zinc-200"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}