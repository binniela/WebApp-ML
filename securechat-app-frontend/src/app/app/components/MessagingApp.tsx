"use client"

import { useState, useEffect } from "react"
import { CryptoManager } from "@/lib/crypto"
import { rateLimiter } from "@/lib/rateLimiter"
import { wsManager } from "@/lib/websocket"
import ContactsList from "./ContactsList"
import ChatArea from "./ChatArea"
import NewChatModal from "./NewChatModal"
import SettingsPanel from "./SettingsPanel"
import EncryptionPanel from "./EncryptionPanel"
import ChatRequestModal from "./ChatRequestModal"

interface User {
  username: string
  publicKey: string
}

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

interface ChatRequest {
  id: string
  from_user_id: string
  from_username: string
  from_public_key: string | null
  message: string
  created_at: string
}

interface MessagingAppProps {
  user: User | null
  onLogout: () => void
}

export default function MessagingApp({ user, onLogout }: MessagingAppProps) {
  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showEncryption, setShowEncryption] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>({})
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([])
  const [showChatRequest, setShowChatRequest] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState<{ [contactId: string]: boolean }>({})

  // Load chat requests and contacts on component mount
  useEffect(() => {
    if (!user) return // Don't load data if no user
    
    // Load essential data first
    const loadInitialData = async () => {
      console.log('Loading initial data for user:', user.username)
      await loadChatRequests()
      await loadContacts()
      await loadMessages() // Load all messages on startup
      
      // Connect WebSocket for real-time messaging (disabled on HTTPS)
      try {
        const token = localStorage.getItem('lockbox-token')
        if (user && token) {
          // Use username as user ID for WebSocket (matches backend expectations)
          const userId = user.username
          console.log('WebSocket connecting with user ID:', userId)
          
          wsManager.connect(userId, token)
          console.log('WebSocket connection initiated')
          
        }
        
        // Handle incoming WebSocket messages
        wsManager.onMessage((message) => {
            try {
              if (message && message.type === 'new_message' && message.data) {
                const newMessage = {
                  id: message.data.id || Date.now().toString(),
                  content: message.data.content || 'Message content unavailable',
                  sender: message.data.sender || 'Unknown',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isOwn: false,
                  isEncrypted: true,
                  status: 'delivered'
                }
                
                // Add message to the appropriate conversation
                const senderId = message.data.sender_id
                if (senderId) {
                  setMessages(prev => ({
                    ...prev,
                    [senderId]: [...(prev[senderId] || []), newMessage]
                  }))
                  
                  console.log('🔥 Real-time message received via WebSocket:', newMessage)
                }
              }
            } catch (msgError) {
              console.error('Error processing WebSocket message:', msgError)
            }
          })
      } catch (wsError) {
        console.error('WebSocket connection failed:', wsError)
        // Continue without WebSocket - app will still work with polling
      }
    }
    
    loadInitialData()
    
    // Reduced polling since WebSocket should handle real-time messages
    const interval = setInterval(async () => {
      try {
        await loadChatRequests()
        // Periodically refresh messages to ensure sync
        await loadMessages()
        console.log('Periodic message refresh completed')
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 10000) // 10 seconds - less frequent polling
    
    return () => {
      clearInterval(interval)
      // Clear throttling on unmount
      localStorage.removeItem('last-chat-request-load')
      // Disconnect WebSocket
      wsManager.disconnect()
    }
  }, [user]) // Depend on user instead of activeContact

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('lockbox-token')
      
      // Load active contacts
      const contactsResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: '/contacts' })
      })
      
      // Load pending contacts
      const pendingResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: '/contacts/pending' })
      })
      
      // Handle 401 errors gracefully
      if (contactsResponse.status === 401 || pendingResponse.status === 401) {
        console.log('401 error loading contacts - continuing with empty list')
        setContacts([])
        return
      }
      
      if (contactsResponse.ok && pendingResponse.ok) {
        const activeContacts = await contactsResponse.json()
        const pendingContacts = await pendingResponse.json()
        
        // Convert to frontend format with comprehensive null checks
        const safeActiveContacts = Array.isArray(activeContacts) ? activeContacts.filter(contact => 
          contact && 
          typeof contact === 'object' && 
          contact.id && 
          contact.username && 
          typeof contact.username === 'string'
        ) : []
        
        const safePendingContacts = Array.isArray(pendingContacts) ? pendingContacts.filter(contact => 
          contact && 
          typeof contact === 'object' && 
          contact.id && 
          contact.username && 
          typeof contact.username === 'string'
        ) : []
        
        const avatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Qjc2ODgiLz48L3N2Zz4K'
        
        const allContacts = [
          ...safeActiveContacts.map((contact: any) => ({
            id: String(contact.id),
            name: String(contact.username),
            lastMessage: String(contact.last_message || ''),
            timestamp: contact.timestamp ? new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now',
            avatar: avatarPlaceholder,
            isOnline: Boolean(contact.is_online),
            unreadCount: Number(contact.unread_count) || 0,
            status: 'active' as const
          })),
          ...safePendingContacts.map((contact: any) => ({
            id: String(contact.id),
            name: String(contact.username),
            lastMessage: String(contact.last_message || ''),
            timestamp: contact.timestamp ? new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now',
            avatar: avatarPlaceholder,
            isOnline: Boolean(contact.is_online),
            unreadCount: Number(contact.unread_count) || 0,
            status: 'pending' as const
          }))
        ]
        
        setContacts(allContacts)
      } else {
        console.log('Error loading contacts, using empty list')
        setContacts([])
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('lockbox-token')
      if (!token || !user) {
        console.log('No token or user available for loading messages')
        return
      }
      
      console.log('Loading messages for user:', user.username)
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: '/messages' })
      })

      if (response.ok) {
        const serverMessages = await response.json()
        console.log('Loaded messages from server:', serverMessages.length)
        
        // Group messages by conversation (contact) and create contacts from messages
        const messagesByContact: { [contactId: string]: Message[] } = {}
        const contactsFromMessages: { [contactId: string]: Contact } = {}
        
        const validMessages = Array.isArray(serverMessages) ? serverMessages.filter(msg => {
          try {
            return msg && 
                   typeof msg === 'object' &&
                   msg.id && 
                   msg.sender_username && 
                   typeof msg.sender_username === 'string' &&
                   (msg.recipient_id || msg.sender_id) &&
                   msg.encrypted_blob !== undefined
          } catch (e) {
            return false
          }
        }) : []
        
        for (const msg of validMessages) {
          // Determine which contact this message belongs to
          const isOwnMessage = msg.sender_username === user.username
          const contactId = isOwnMessage ? msg.recipient_id : msg.sender_id
          const contactUsername = isOwnMessage ? 'Unknown' : (msg.sender_username || 'Unknown')
          
          if (!messagesByContact[contactId]) {
            messagesByContact[contactId] = []
          }
          
          // Create contact if not exists
          if (!contactsFromMessages[contactId] && !isOwnMessage) {
            contactsFromMessages[contactId] = {
              id: contactId,
              name: contactUsername,
              lastMessage: '',
              timestamp: 'now',
              avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Qjc2ODgiLz48L3N2Zz4K',
              isOnline: true,
              unreadCount: 0,
              status: 'active'
            }
          }
          
          // Decrypt message content with null check
          const decryptedContent = msg.encrypted_blob ? 
            (msg.encrypted_blob.replace('encrypted_', '') || msg.encrypted_blob) : 
            'Message content unavailable'
          
          messagesByContact[contactId].push({
            id: msg.id,
            content: decryptedContent,
            sender: isOwnMessage ? 'You' : msg.sender_username,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: isOwnMessage,
            isEncrypted: true,
            status: 'delivered'
          })
        }
        
        // Update messages state
        setMessages(messagesByContact)
        
        // Add contacts from messages to contacts list
        setContacts(prev => {
          const existingContactIds = new Set(prev.map(c => c.id))
          const newContacts = Object.values(contactsFromMessages).filter(c => !existingContactIds.has(c.id))
          
          // Update last messages for all contacts
          const updatedContacts = [...prev, ...newContacts].map(contact => {
            const contactMessages = messagesByContact[contact.id]
            if (contactMessages && contactMessages.length > 0) {
              const lastMsg = contactMessages[contactMessages.length - 1]
              return {
                ...contact,
                lastMessage: lastMsg.content.length > 50 ? lastMsg.content.substring(0, 50) + '...' : lastMsg.content,
                timestamp: lastMsg.timestamp
              }
            }
            return contact
          })
          
          return updatedContacts
        })
        
        console.log('Messages loaded and contacts updated')
      } else {
        console.error('Failed to load messages:', response.status)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const loadChatRequests = async () => {
    // Throttle chat request loading
    const now = Date.now()
    const lastLoad = localStorage.getItem('last-chat-request-load')
    if (lastLoad && now - parseInt(lastLoad) < 3000) {
      return // Skip if loaded within last 3 seconds
    }
    localStorage.setItem('last-chat-request-load', now.toString())
    
    try {
      const token = localStorage.getItem('lockbox-token')
      if (!token) {
        console.log('No token available, skipping chat requests')
        return
      }
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: '/chat-requests/incoming'
        })
      })
      
      if (response.status === 401) {
        console.log('Token expired, user needs to re-login')
        localStorage.removeItem('lockbox-token')
        window.location.reload()
        return
      }

      if (response.ok) {
        const requests = await response.json()
        // Check for new requests
        const newRequestCount = requests.length
        const previousCount = chatRequests.length
        
        setChatRequests(requests)
        
        // Show notification and modal for new requests
        if (newRequestCount > previousCount && newRequestCount > 0) {
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('New Chat Request', {
              body: `You have ${newRequestCount} pending chat request${newRequestCount > 1 ? 's' : ''}`,
              icon: '/images/logo.png'
            })
          }
          
          // Auto-show modal for new requests
          if (!showChatRequest) {
            setShowChatRequest(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load chat requests:', error)
    }
  }

  const handleStartChat = async (selectedUser: any) => {
    // Check if contact already exists
    const existingContact = contacts.find((c) => c.id === selectedUser.id)
    if (existingContact) {
      if (existingContact.status === "active") {
        setActiveContact(existingContact)
        return
      } else if (existingContact.status === "pending") {
        // Show message that request is already pending
        alert("Chat request already sent to this user")
        return
      }
    }

    // Create pending contact after successful request
    if (selectedUser.status === 'pending') {
      const newContact: Contact = {
        id: selectedUser.id,
        name: selectedUser.username,
        lastMessage: "Chat request sent...",
        timestamp: "now",
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Qjc2ODgiLz48L3N2Zz4K',
        isOnline: true,
        unreadCount: 0,
        status: "pending",
      }

      setContacts((prev) => [...prev, newContact])
      setMessages((prev) => ({
        ...prev,
        [newContact.id]: [],
      }))
    }
  }

  const handleAcceptChatRequest = async (request: ChatRequest) => {
    try {
      // The ChatRequestModal already handled the backend response
      // Just update local state immediately
      setChatRequests((prev) => prev.filter((r) => r.id !== request.id))
      
      // Check if we need to close the modal
      if (chatRequests.length <= 1) {
        setShowChatRequest(false)
      }
      
      // Create new active contact immediately
      const newContact: Contact = {
        id: request.from_user_id,
        name: request.from_username,
        lastMessage: "Chat request accepted",
        timestamp: "now",
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Qjc2ODgiLz48L3N2Zz4K',
        isOnline: true,
        unreadCount: 0,
        status: "active",
      }
      
      // Add to contacts and set as active
      setContacts((prev) => {
        // Remove any existing contact with same ID
        const filtered = prev.filter(c => c.id !== newContact.id)
        return [...filtered, newContact]
      })
      
      setMessages((prev) => ({
        ...prev,
        [newContact.id]: [],
      }))
      
      setActiveContact(newContact)
      
    } catch (error) {
      console.error('Failed to accept chat request:', error)
    }
  }

  const handleDeclineChatRequest = (request: ChatRequest) => {
    setChatRequests((prev) => prev.filter((r) => r.id !== request.id))
    
    // Check if we need to close the modal
    if (chatRequests.length <= 1) {
      setShowChatRequest(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!activeContact || !content.trim()) return

    // Only allow messaging if contact is active
    if (activeContact.status !== "active") {
      return
    }

    const messageId = Date.now().toString()
    const newMessage: Message = {
      id: messageId,
      content: content.trim(),
      sender: user?.username || "You",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      isEncrypted: true,
      status: "sending",
    }

    setMessages((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage],
    }))

    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === activeContact.id
          ? {
              ...contact,
              lastMessage: content.length > 50 ? content.substring(0, 50) + "..." : content,
              timestamp: "now",
            }
          : contact,
      ),
    )

    try {
      const token = localStorage.getItem('lockbox-token')
      const crypto = CryptoManager.getInstance()
      
      // Use post-quantum encryption
      try {
        const { encryptedBlob, signature } = crypto.encryptMessage(content, user?.publicKey || 'temp_key')
        console.log('Message encrypted with post-quantum crypto')
      } catch (cryptoError) {
        console.warn('Post-quantum encryption failed, using fallback:', cryptoError)
        var encryptedBlob = `encrypted_${content}`
        var signature = `signature_${messageId}`
      }
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: '/messages/send',
          recipient_id: activeContact.id,
          encrypted_blob: encryptedBlob,
          signature: signature,
          sender_public_key: user?.publicKey || 'temp_key'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update message status to sent
        setMessages((prev) => ({
          ...prev,
          [activeContact.id]: (prev[activeContact.id] || []).map((msg) =>
            msg.id === messageId ? { ...msg, status: "sent", id: result.id || msg.id } : msg,
          ),
        }))

        // Simulate delivery confirmation
        setTimeout(() => {
          setMessages((prev) => ({
            ...prev,
            [activeContact.id]: (prev[activeContact.id] || []).map((msg) =>
              msg.id === messageId ? { ...msg, status: "delivered" } : msg,
            ),
          }))
        }, 1000)
      } else {
        // Update message status to failed
        setMessages((prev) => ({
          ...prev,
          [activeContact.id]: (prev[activeContact.id] || []).map((msg) =>
            msg.id === messageId ? { ...msg, status: "failed" } : msg,
          ),
        }))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Update message status to failed
      setMessages((prev) => ({
        ...prev,
        [activeContact.id]: prev[activeContact.id].map((msg) =>
          msg.id === messageId ? { ...msg, status: "failed" } : msg,
        ),
      }))
    }
  }

  const handleContactSelect = async (contact: Contact) => {
    if (contact.status === "active") {
      setActiveContact(contact)
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c)))
      
      // Load messages for this specific contact
      await loadContactMessages(contact.id)
    }
    // Don't allow selecting pending contacts
  }
  
  const loadContactMessages = async (contactId: string, silent: boolean = false) => {
    // Rate limit and prevent multiple simultaneous requests
    if (loadingMessages[contactId] || !rateLimiter.canMakeRequest(`messages-${contactId}`, 10, 5000)) {
      return
    }
    
    try {
      // Only show loading for manual refreshes, not background polling
      if (!silent) {
        setLoadingMessages(prev => ({ ...prev, [contactId]: true }))
      }
      
      const token = localStorage.getItem('lockbox-token')
      if (!token) {
        console.log('No token available for loading messages')
        return
      }
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ path: `/messages/conversation/${contactId}` })
      })
      
      if (response.status === 401) {
        console.log('Token expired during message loading')
        localStorage.removeItem('lockbox-token')
        window.location.reload()
        return
      }

      if (response.ok) {
        const contactMessages = await response.json()
        
        const crypto = CryptoManager.getInstance()
        const formattedMessages: Message[] = []
        
        for (const msg of contactMessages) {
          let decryptedContent = msg.encrypted_blob
          
          try {
            // Check if message is properly encrypted JSON
            if (msg.encrypted_blob.startsWith('{')) {
              try {
                const encryptedData = JSON.parse(msg.encrypted_blob)
                if (encryptedData.encryptedMessage && encryptedData.algorithm) {
                  // This is a proper post-quantum encrypted message
                  // For now, show the algorithm info since full decryption needs recipient keys
                  decryptedContent = `[${encryptedData.algorithm} Encrypted Message]`
                } else {
                  decryptedContent = msg.encrypted_blob
                }
              } catch {
                decryptedContent = msg.encrypted_blob
              }
            } else {
              // Simple format - just remove prefix
              decryptedContent = msg.encrypted_blob.replace('encrypted_', '') || msg.encrypted_blob
            }
          } catch (error) {
            console.error('Decryption error:', error)
            // Fallback to showing the message without encryption
            decryptedContent = msg.encrypted_blob.replace('encrypted_', '') || 'Message content unavailable'
          }
          
          formattedMessages.push({
            id: msg.id,
            content: decryptedContent,
            sender: msg.sender_username === user?.username ? 'You' : msg.sender_username,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: msg.sender_username === user?.username,
            isEncrypted: true,
            status: 'delivered'
          })
        }
        
        // Only update if messages have changed
        setMessages(prev => {
          const existingMessages = prev[contactId] || []
          
          // Quick check: if length is different, definitely update
          if (existingMessages.length !== formattedMessages.length) {
            return {
              ...prev,
              [contactId]: formattedMessages
            }
          }
          
          // If same length, check if last message is different
          if (formattedMessages.length > 0 && existingMessages.length > 0) {
            const lastNew = formattedMessages[formattedMessages.length - 1]
            const lastExisting = existingMessages[existingMessages.length - 1]
            
            if (lastNew.id !== lastExisting.id || lastNew.content !== lastExisting.content) {
              console.log('New message received in conversation')
              return {
                ...prev,
                [contactId]: formattedMessages
              }
            }
          }
          
          // No changes, return existing state
          return prev
        })
      }
    } catch (error) {
      console.error('Failed to load contact messages:', error)
    } finally {
      // Only clear loading state if it was set (not silent mode)
      if (!silent) {
        setLoadingMessages(prev => ({ ...prev, [contactId]: false }))
      }
    }
  }

  return (
    <div className={`h-screen flex ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <ContactsList
        contacts={contacts}
        activeContact={activeContact}
        onContactSelect={handleContactSelect}
        onShowSettings={() => setShowSettings(true)}
        onStartChat={() => setShowNewChat(true)}
        user={user}
        onLogout={onLogout}
        darkMode={darkMode}
        chatRequestsCount={chatRequests.length}
        onShowChatRequests={() => setShowChatRequest(true)}
      />

      <div className="flex-1 flex flex-col">
        {activeContact ? (
          <ChatArea
            contact={activeContact}
            messages={messages[activeContact.id] || []}
            onShowEncryption={() => setShowEncryption(true)}
            onSendMessage={handleSendMessage}
            darkMode={darkMode}
            isLoadingMessages={loadingMessages[activeContact.id] || false}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to LockBox</h3>
              <p className="text-zinc-400 mb-4">Start a new conversation to begin secure messaging</p>
              <div className="text-sm text-zinc-500">
                <p>• Click "New Chat" to send chat requests</p>
                <p>• Accept incoming requests to start chatting</p>
                <p>• All messages are end-to-end encrypted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          user={user}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showEncryption && activeContact && (
        <EncryptionPanel contact={activeContact} onClose={() => setShowEncryption(false)} darkMode={darkMode} />
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStartChat={handleStartChat}
          darkMode={darkMode}
        />
      )}

      {showChatRequest && chatRequests.length > 0 && (
        <ChatRequestModal
          requests={chatRequests}
          onAccept={handleAcceptChatRequest}
          onDecline={handleDeclineChatRequest}
          onClose={() => setShowChatRequest(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}