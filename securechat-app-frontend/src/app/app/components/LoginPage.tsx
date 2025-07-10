"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Key, Upload, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { CryptoManager } from '@/lib/crypto'

interface LoginPageProps {
  onLogin: (userData: { username: string; publicKey: string }) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [keyMethod, setKeyMethod] = useState<"generate" | "import">("generate")
  const [importedKyberKey, setImportedKyberKey] = useState("")
  const [importedMldsaKey, setImportedMldsaKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showErrorModal, setShowErrorModal] = useState(false)

  const crypto = CryptoManager.getInstance()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Authenticate with server
      const response = await fetch('http://10.201.154.21:8001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Login failed')

      // 2. Load or generate crypto keys CLIENT-SIDE
      let keys
      if (keyMethod === "generate") {
        // Try to load existing keys first
        keys = crypto.loadKeysFromStorage(password)
        if (!keys) {
          // Generate new keys if none exist
          keys = crypto.generateKeyPairs()
        }
      } else {
        // Import user's own keys
        if (!importedKyberKey || !importedMldsaKey) {
          throw new Error('Please provide both Kyber and ML-DSA private keys')
        }
        keys = crypto.importKeys(importedKyberKey, importedMldsaKey)
      }

      // 3. Send ONLY public keys to server
      await fetch('http://10.201.154.21:8001/auth/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.access_token}`
        },
        body: JSON.stringify({
          user_id: data.user.id,
          kyber_public_key: keys.kyber.publicKey,
          mldsa_public_key: keys.mldsa.publicKey
        }),
      })

      // 4. Store JWT token and login successful
      localStorage.setItem('lockbox-token', data.access_token)
      onLogin({ 
        username: data.user.username, 
        publicKey: keys.kyber.publicKey 
      })

    } catch (error: any) {
      setError('Login failed: ' + (error?.message || 'Unknown error'))
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Register with server
      const response = await fetch('http://10.201.154.21:8001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Registration failed')

      // 2. Generate crypto keys CLIENT-SIDE
      let keys
      if (keyMethod === "generate") {
        keys = crypto.generateKeyPairs()
      } else {
        if (!importedKyberKey || !importedMldsaKey) {
          throw new Error('Please provide both Kyber and ML-DSA private keys')
        }
        keys = crypto.importKeys(importedKyberKey, importedMldsaKey)
      }

      // 3. Send ONLY public keys to server
      await fetch('http://10.201.154.21:8001/auth/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.access_token}`
        },
        body: JSON.stringify({
          user_id: data.user.id,
          kyber_public_key: keys.kyber.publicKey,
          mldsa_public_key: keys.mldsa.publicKey
        }),
      })

      // 4. Store JWT token and registration successful
      localStorage.setItem('lockbox-token', data.access_token)
      onLogin({ 
        username: data.user.username, 
        publicKey: keys.kyber.publicKey 
      })

    } catch (error: any) {
      setError('Registration failed: ' + (error?.message || 'Unknown error'))
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 to-black"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Image src="/images/logo.png" alt="LockBox Logo" width={64} height={64} className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">LockBox</h1>
          <p className="text-zinc-400">Quantum-safe messaging</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-700 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-center">Access Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    required
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Cryptographic Keys</label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={keyMethod === "generate" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeyMethod("generate")}
                        className="flex-1"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant={keyMethod === "import" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeyMethod("import")}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </div>

                    {keyMethod === "import" && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Kyber private key..."
                          value={importedKyberKey}
                          onChange={(e) => setImportedKyberKey(e.target.value)}
                          className="bg-zinc-800 border-zinc-600 text-white font-mono text-xs"
                        />
                        <Input
                          type="text"
                          placeholder="ML-DSA private key..."
                          value={importedMldsaKey}
                          onChange={(e) => setImportedMldsaKey(e.target.value)}
                          className="bg-zinc-800 border-zinc-600 text-white font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isLoading}>
                    {isLoading ? "Authenticating..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Choose username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    required
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Cryptographic Keys</label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={keyMethod === "generate" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeyMethod("generate")}
                        className="flex-1"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant={keyMethod === "import" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeyMethod("import")}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </div>

                    {keyMethod === "import" && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Kyber private key..."
                          value={importedKyberKey}
                          onChange={(e) => setImportedKyberKey(e.target.value)}
                          className="bg-zinc-800 border-zinc-600 text-white font-mono text-xs"
                        />
                        <Input
                          type="text"
                          placeholder="ML-DSA private key..."
                          value={importedMldsaKey}
                          onChange={(e) => setImportedMldsaKey(e.target.value)}
                          className="bg-zinc-800 border-zinc-600 text-white font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-red-500/20 rounded-lg p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Authentication Failed</h3>
                <p className="text-red-400 text-sm mb-6">{error}</p>
                <Button
                  onClick={() => {
                    setShowErrorModal(false)
                    setError("")
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}