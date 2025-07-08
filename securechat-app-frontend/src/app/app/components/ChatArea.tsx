"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Shield, Info, MoreVertical, Lock, Clock, Check, AlertCircle } from "lucide-react"

interface Contact {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  avatar: string
  isOnline: boolean
  unreadCount: number
  status: "active" | "pending" | "blocked"
}

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  isOwn: boolean
  isEncrypted: boolean
  status: "sending" | "sent" | "delivered" | "failed"
}

interface ChatAreaProps {
  contact: Contact
  messages: Message[]
  onShowEncryption: () => void
  onSendMessage: (content: string) => void
  darkMode: boolean
  isLoadingMessages?: boolean
}

export default function ChatArea({ contact, messages, onShowEncryption, onSendMessage, darkMode, isLoadingMessages }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && contact.status === "active") {
      onSendMessage(newMessage)
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />
      case "delivered":
        return <Shield className="w-3 h-3 text-green-500" />
      case "failed":
        return <Shield className="w-3 h-3 text-red-500" />
      default:
        return <Shield className="w-3 h-3 text-gray-400" />
    }
  }

  const isPendingContact = contact.status === "pending"

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div
        className={`p-4 border-b ${darkMode ? "border-zinc-700 bg-zinc-900" : "border-gray-200 bg-white"} flex items-center justify-between`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={contact.avatar || "/placeholder.svg"} alt={contact.name} className="w-10 h-10 rounded-full" />
            {contact.isOnline && contact.status === "active" && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{contact.name}</h2>
            <div className="flex items-center space-x-2">
              {contact.status === "active" ? (
                <>
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                    End-to-end encrypted • Kyber1024
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-yellow-500" />
                  <span className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                    Waiting for acceptance
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {contact.status === "active" && (
            <Button variant="ghost" size="icon" onClick={onShowEncryption}>
              <Info className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isPendingContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">Chat Request Sent</h3>
              <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                Waiting for {contact.name} to accept your chat request.
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
                You'll be able to send messages once they accept.
              </p>
            </div>
          </div>
        ) : isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading messages...</h3>
              <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                Decrypting your secure conversation with {contact.name}
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-lg font-semibold mb-2">Secure conversation with {contact.name}</h3>
              <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                Messages are end-to-end encrypted. Send your first message to start the conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.isOwn ? "bg-white text-black" : darkMode ? "bg-zinc-700 text-white" : "bg-gray-200 text-black"
                } shadow-sm`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${
                      message.isOwn ? "text-gray-600" : darkMode ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp}
                  </span>
                  {message.isOwn && (
                    <div className="flex items-center space-x-1 ml-2">{getStatusIcon(message.status)}</div>
                  )}
                  {!message.isOwn && message.isEncrypted && <Shield className="w-3 h-3 text-green-500 ml-2" />}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
        {isPendingContact ? (
          <div className={`text-center py-4 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
            <AlertCircle className="w-5 h-5 mx-auto mb-2" />
            <p className="text-sm">Cannot send messages until chat request is accepted</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder={`Send a secure message to ${contact.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`flex-1 ${darkMode ? "bg-zinc-800 border-zinc-600" : "bg-white border-gray-300"}`}
                maxLength={1000}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-white text-black hover:bg-zinc-200"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className={`text-xs mt-1 ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              Messages are encrypted with post-quantum cryptography
            </div>
          </>
        )}
      </div>
    </div>
  )
}
