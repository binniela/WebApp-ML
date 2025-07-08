"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Users, Award } from 'lucide-react'

const achievements = [
  { icon: <Shield className="w-6 h-6" />, label: "Years of Security Research", value: "8+" },
  { icon: <Lock className="w-6 h-6" />, label: "Encryption Algorithms", value: "5+" },
  { icon: <Users className="w-6 h-6" />, label: "Security Audits", value: "12+" },
  { icon: <Award className="w-6 h-6" />, label: "Certifications", value: "3+" },
]

export default function AboutSection() {
  return (
    <section id="about" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 rounded-3xl transform -rotate-6"></div>
            <div className="w-full h-96 bg-zinc-800 rounded-3xl relative z-10 flex items-center justify-center">
              <Shield className="w-32 h-32 text-white/50" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">About LockBox</h2>
            <p className="text-lg mb-6 text-zinc-300">
              LockBox isn't just another messaging app; it's a fortress for your digital communications. Built with
              post-quantum cryptography and zero-knowledge architecture, we ensure your conversations remain private
              even against future quantum computing threats.
            </p>
            <p className="text-lg mb-8 text-zinc-300">
              From personal conversations to enterprise communications, LockBox's advanced encryption protocols and
              intuitive design make secure messaging accessible to everyone without compromising on security or
              usability.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.label}
                  className="bg-zinc-900/50 rounded-lg p-4 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center mb-2">
                    <div className="mr-2 text-white">{achievement.icon}</div>
                    <div className="text-2xl font-bold">{achievement.value}</div>
                  </div>
                  <div className="text-sm text-zinc-400">{achievement.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}