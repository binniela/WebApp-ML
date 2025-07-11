"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, User, Check, XIcon, Clock } from "lucide-react"

interface ChatRequest {
  id: string
  from_user_id: string
  from_username: string
  from_public_key: string | null
  message: string
  created_at: string
}

interface ChatRequestModalProps {
  requests: ChatRequest[]
  onAccept: (request: ChatRequest) => void
  onDecline: (request: ChatRequest) => void
  onClose: () => void
  darkMode: boolean
}

export default function ChatRequestModal({ 
  requests, 
  onAccept, 
  onDecline, 
  onClose, 
  darkMode 
}: ChatRequestModalProps) {
  const handleAccept = async (request: ChatRequest) => {
    try {
      const token = localStorage.getItem('lockbox-token')
      const response = await fetch('/api/proxy/chat-requests/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: request.id,
          action: 'accept'
        })
      })

      if (response.ok) {
        const result = await response.json()
        onAccept(request)
      } else {
        console.error('Failed to accept chat request')
      }
    } catch (error) {
      console.error('Accept request error:', error)
    }
  }

  const handleDecline = async (request: ChatRequest) => {
    try {
      const token = localStorage.getItem('lockbox-token')
      const response = await fetch('/api/proxy/chat-requests/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: request.id,
          action: 'decline'
        })
      })

      if (response.ok) {
        onDecline(request)
      } else {
        console.error('Failed to decline chat request')
      }
    } catch (error) {
      console.error('Decline request error:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    } catch {
      return 'Recently'
    }
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md max-h-[80vh] overflow-hidden ${
        darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">Chat Requests</CardTitle>
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {requests.length}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-zinc-800 border-zinc-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-zinc-700' : 'bg-gray-200'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{request.from_username}</p>
                  <div className="flex items-center space-x-2 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(request.created_at)}</span>
                    {request.from_public_key && (
                      <span className="text-green-500">• Quantum-safe</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              {request.message && (
                <div className={`p-3 rounded-lg mb-3 ${
                  darkMode ? 'bg-zinc-700' : 'bg-white'
                }`}>
                  <p className="text-sm">{request.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecline(request)}
                  className="flex-1"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(request)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}