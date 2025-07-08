"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Shield, Key, RefreshCw, CheckCircle } from "lucide-react"

interface Contact {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  avatar: string
  isOnline: boolean
  unreadCount: number
}

interface EncryptionPanelProps {
  contact: Contact
  onClose: () => void
  darkMode: boolean
}

export default function EncryptionPanel({ contact, onClose, darkMode }: EncryptionPanelProps) {
  const sessionKey = "kyber1024_a7f3d9e2b8c4f1a6"
  const publicKeyFingerprint = "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8"
  const lastKeyExchange = "2 minutes ago"

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className={`fixed right-0 top-0 h-full w-96 ${
        darkMode ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
      } border-l shadow-xl z-50 overflow-y-auto`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Encryption Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Contact Info */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <img
                  src={contact.avatar || "/placeholder.svg"}
                  alt={contact.name}
                  className="w-8 h-8 rounded-full mr-3"
                />
                {contact.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">End-to-end encrypted</span>
              </div>
            </CardContent>
          </Card>

          {/* Session Status */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">Encryption Algorithm</p>
                <p className={`text-sm font-mono ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>
                  Kyber1024 + AES-256-GCM
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">Session Key</p>
                <p className={`text-xs font-mono break-all ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>
                  {sessionKey}
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">Last Key Exchange</p>
                <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>{lastKeyExchange}</p>
              </div>

              <Button className="w-full bg-white text-black hover:bg-zinc-200">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Session
              </Button>
            </CardContent>
          </Card>

          {/* Public Key Fingerprints */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Key Fingerprints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">Your Public Key</p>
                <p className={`text-xs font-mono break-all ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>
                  {publicKeyFingerprint}
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">{contact.name}'s Public Key</p>
                <p className={`text-xs font-mono break-all ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>
                  SHA256:b3BlbkFckdDQexaZI4fcAK6T8jHdOBFrAuDhZxXjgQE
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg">Security Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Perfect Forward Secrecy</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Post-Quantum Resistant</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Message Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Metadata Protection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
