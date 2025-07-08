"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Settings, LogOut, Users, Bell, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"

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

interface User {
  username: string
  publicKey: string
}

interface ContactsListProps {
  contacts: Contact[]
  activeContact: Contact | null
  onContactSelect: (contact: Contact) => void
  onShowSettings: () => void
  onStartChat: () => void  // Changed to just trigger the modal
  user: User | null
  onLogout: () => void
  darkMode: boolean
  chatRequestsCount: number
  onShowChatRequests: () => void
}

export default function ContactsList({
  contacts,
  activeContact,
  onContactSelect,
  onShowSettings,
  user,
  onLogout,
  darkMode,
  onStartChat,
  chatRequestsCount,
  onShowChatRequests,
}: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getContactStatusIcon = (status: Contact["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3 text-yellow-500" />
      case "active":
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case "blocked":
        return <div className="w-3 h-3 bg-red-500 rounded-full" />
      default:
        return null
    }
  }

  return (
    <div
      className={`w-80 border-r ${darkMode ? "bg-zinc-900 border-zinc-700" : "bg-gray-50 border-gray-200"} flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Image src="/images/logo.png" alt="LockBox Logo" width={24} height={24} className="w-6 h-6" />
            <h1 className="text-xl font-bold">LockBox</h1>
          </div>
          <div className="flex space-x-2">
            {/* Chat Requests Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowChatRequests}
              className="relative"
              disabled={chatRequestsCount === 0}
            >
              <Bell className="w-4 h-4" />
              {chatRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chatRequestsCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onShowSettings}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${darkMode ? "bg-zinc-800 border-zinc-600" : "bg-white border-gray-300"}`}
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={onStartChat}>
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat Requests Notification */}
      {chatRequestsCount > 0 && (
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full bg-blue-500/10 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            onClick={onShowChatRequests}
          >
            <Bell className="w-4 h-4 mr-2" />
            {chatRequestsCount} Chat Request{chatRequestsCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Users className={`w-16 h-16 mb-4 ${darkMode ? "text-zinc-600" : "text-gray-400"}`} />
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-zinc-300" : "text-gray-600"}`}>
              No conversations yet
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
              Start your first secure conversation by clicking "New Chat" above
            </p>
            <Button variant="outline" size="sm" onClick={onStartChat} className="bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Find Users
            </Button>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 cursor-pointer border-b ${darkMode ? "border-zinc-700" : "border-gray-200"} ${
                activeContact?.id === contact.id ? (darkMode ? "bg-zinc-700" : "bg-blue-50") : ""
              } ${
                contact.status === "pending" ? "opacity-60" : `hover:${darkMode ? "bg-zinc-700/50" : "bg-gray-100"}`
              } transition-colors`}
              onClick={() => onContactSelect(contact)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {contact.isOnline && contact.status === "active" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold truncate">{contact.name}</h3>
                      {getContactStatusIcon(contact.status)}
                    </div>
                    <span className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                      {contact.timestamp}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      contact.status === "pending"
                        ? "text-yellow-500 italic"
                        : darkMode
                          ? "text-zinc-400"
                          : "text-gray-600"
                    }`}
                  >
                    {contact.lastMessage}
                  </p>
                </div>

                {contact.unreadCount > 0 && contact.status === "active" && (
                  <div className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Info */}
      <div className={`p-4 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.username}</p>
            <p className={`text-xs truncate font-mono ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
              {user?.publicKey?.substring(0, 16)}...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}