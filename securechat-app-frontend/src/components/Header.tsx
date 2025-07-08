"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Image from "next/image"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className={`flex items-center space-x-3 text-3xl font-bold tracking-tighter transition-colors duration-300 ${
            isScrolled ? "text-black" : "text-white"
          }`}
        >
          <Image src="/images/logo.png" alt="LockBox Logo" width={40} height={40} className="w-10 h-10 -mt-1 ml-1" />
          <span>LockBox</span>
        </Link>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`transition-colors duration-300 ${
              isScrolled ? "text-black hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
          >
            <Menu />
          </Button>
        </div>

        <nav
          className={`${isMenuOpen ? "block" : "hidden"} md:block absolute md:relative top-full left-0 w-full md:w-auto ${
            isScrolled ? "bg-white md:bg-transparent" : "bg-black md:bg-transparent"
          } transition-colors duration-300`}
        >
          <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0">
            <li>
              <Link
                href="#features"
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-black hover:text-purple-600" : "text-white hover:text-purple-400"
                }`}
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="#security"
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-black hover:text-purple-600" : "text-white hover:text-purple-400"
                }`}
              >
                Security
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-black hover:text-purple-600" : "text-white hover:text-purple-400"
                }`}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <Button
          asChild
          variant="outline"
          className={`hidden md:block transition-all duration-300 ${
            isScrolled
              ? "bg-transparent border-black text-black hover:bg-black hover:text-white"
              : "bg-transparent border-white text-white hover:bg-white hover:text-black"
          }`}
        >
          <Link href="/app">Launch App</Link>
        </Button>
      </div>
    </header>
  )
}
