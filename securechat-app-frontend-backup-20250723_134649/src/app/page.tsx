"use client"
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import AboutSection from "@/components/AboutSection"
import ContactSection from "@/components/ContactSection"
import Footer from "@/components/Footer"
import InteractiveBackground from "@/components/InteractiveBackground"
import ClientOnly from "@/components/ClientOnly"

export default function Home() {
  return (
    <div className="min-h-screen text-white relative">
      <ClientOnly fallback={<div className="fixed inset-0 w-full h-full -z-10 bg-black" />}>
        <InteractiveBackground />
      </ClientOnly>
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4">
          <HeroSection />
          <AboutSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}