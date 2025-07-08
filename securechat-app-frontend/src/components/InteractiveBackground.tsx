"use client"

import { useEffect, useState } from "react"

export default function InteractiveBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="fixed inset-0 w-full h-full -z-10 bg-black" />
  }

  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-br from-zinc-900/20 to-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
    </div>
  )
}