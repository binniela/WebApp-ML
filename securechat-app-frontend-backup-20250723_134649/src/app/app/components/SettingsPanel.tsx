"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Download, Upload, Key, Clock, Moon, Sun } from "lucide-react"

interface User {
  username: string
  publicKey: string
}

interface SettingsPanelProps {
  user: User | null
  darkMode: boolean
  onDarkModeToggle: () => void
  onClose: () => void
}

export default function SettingsPanel({ user, darkMode, onDarkModeToggle, onClose }: SettingsPanelProps) {
  const [messageExpiration, setMessageExpiration] = useState(false)
  const [expirationTime, setExpirationTime] = useState("24")

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
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <Input
                  value={user?.username || ""}
                  readOnly
                  className={darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Public Key</label>
                <Input
                  value={user?.publicKey || ""}
                  readOnly
                  className={`font-mono text-xs ${darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cryptographic Keys */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Cryptographic Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Keys
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import Keys
              </Button>
            </CardContent>
          </Card>

          {/* Message Settings */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Message Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Disappearing Messages</p>
                  <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                    Messages will be deleted automatically
                  </p>
                </div>
                <Switch checked={messageExpiration} onCheckedChange={setMessageExpiration} />
              </div>

              {messageExpiration && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Expiration Time (hours)</label>
                  <Input
                    type="number"
                    value={expirationTime}
                    onChange={(e) => setExpirationTime(e.target.value)}
                    className={darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"}>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Toggle dark/light theme</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={onDarkModeToggle} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
