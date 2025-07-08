"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Key, Zap } from 'lucide-react'
import Link from "next/link"

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)

  const stats = [
    { icon: <Shield className="w-6 h-6" />, label: "Messages Encrypted", value: "10M+" },
    { icon: <Lock className="w-6 h-6" />, label: "Active Users", value: "50K+" },
    { icon: <Key className="w-6 h-6" />, label: "Key Exchanges", value: "1M+" },
    { icon: <Zap className="w-6 h-6" />, label: "Uptime", value: "99.9%" },
  ]

  return (
    <section className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black"></div>

      <div className="relative pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-7xl md:text-8xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                Secure Communication
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-zinc-400 max-w-3xl mx-auto">
              End-to-end encrypted messaging with post-quantum cryptography. Protect your conversations with
              military-grade security that's built for the future.
            </p>
            <div className="relative inline-block">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-zinc-200 text-lg px-8 py-6 rounded-full"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  asChild
                >
                  <Link href="/app">
                    <span>Launch LockBox</span>
                    <motion.span
                      animate={{ x: isHovered ? 5 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-2"
                    >
                      →
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="bg-zinc-900/50 rounded-xl p-6 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-colors">
                  <div className="mb-2 text-white/70 flex justify-center">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}