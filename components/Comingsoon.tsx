"use client"

import React, { useState, useEffect } from "react"
import { Instagram, Facebook, Phone, MapPin } from "lucide-react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [mounted, setMounted] = useState(false)

  // Prevent scrolling on this page
  useEffect(() => {
    document.body.style.overflow = "hidden"
    setMounted(true)

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const launchDateString =
        process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-03-01T00:00:00"
      const launchDate = new Date(launchDateString).getTime()
      const difference = launchDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60)
          ),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [mounted])

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600;700&family=Lora:wght@400;500&family=Orbitron:wght@700;900&family=Amiri:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* Main Container */}
      <div className="relative h-[100dvh] min-h-screen flex items-center justify-center overflow-hidden px-4" style={{ 
  minHeight: '-webkit-fill-available'
}}>
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/background.jpg)" }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">

          {/* Logo */}
          <div className="mb-8">
            <div className="w-28 h-28 md:w-36 md:h-36 bg-white/95 border-4 border-amber-400 rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-6">
              <img
                src="/log.png"
                alt="Melek Coiff"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 drop-shadow-2xl"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Melek Coiff
            </h1>

            <p
              className="text-xl md:text-2xl text-amber-400 mb-3 tracking-widest"
              style={{ fontFamily: '"Raleway", sans-serif' }}
            >
              BIENTÔT DISPONIBLE
            </p>

            <p
              className="text-base md:text-lg text-white max-w-2xl mx-auto"
              style={{ fontFamily: '"Lora", serif' }}
            >
              Une nouvelle façon de gérer votre attente
            </p>
          </div>

          {/* Countdown */}
          <div className="mb-10">
            <h2 className="text-xl md:text-2xl text-white mb-6 tracking-wide">
              LANCEMENT DANS
            </h2>

            <div className="flex justify-center items-center gap-3 md:gap-6">
              {["days", "hours", "minutes", "seconds"].map((unit, index) => (
                <React.Fragment key={unit}>
                  <div className="text-center">
                    <div
                      className="text-3xl md:text-6xl font-bold bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
                      style={{ fontFamily: '"Orbitron", monospace' }}
                    >
                      {mounted
                        ? String(timeLeft[unit as keyof TimeLeft]).padStart(
                            2,
                            "0"
                          )
                        : "--"}
                    </div>
                    <div className="text-xs md:text-sm text-white uppercase tracking-widest mt-1">
                      {unit === "days"
                        ? "Jours"
                        : unit === "hours"
                        ? "Heures"
                        : unit === "minutes"
                        ? "Minutes"
                        : "Secondes"}
                    </div>
                  </div>

                  {index < 3 && (
                    <div
                      className="text-3xl md:text-6xl text-amber-400 font-bold -mt-3"
                      style={{ fontFamily: '"Orbitron", monospace' }}
                    >
                      :
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div className="mb-8">
            <p className="text-lg md:text-xl text-white mb-5">
              Suivez-nous
            </p>

            <div className="flex justify-center gap-6">
              <a
                href="https://www.instagram.com/mvleek__coiff_93/"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn"
              >
                <Instagram />
              </a>

              <a
                href="https://www.facebook.com/malek.boulares.50"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn"
              >
                <Facebook />
              </a>

              <a href="tel:+21652265816" className="icon-btn">
                <Phone />
              </a>

              <a
                href="https://maps.app.goo.gl/XQp8N7fo7aTGjnRi7"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn"
              >
                <MapPin />
              </a>
            </div>
          </div>

          {/* Ramadan */}
          <div className="flex items-center justify-center gap-4 text-white">
            <span className="text-2xl">🌙</span>
            <div className="h-px bg-white/40 w-16 md:w-24" />
            <span
              className="text-lg md:text-xl"
              style={{ fontFamily: '"Amiri", serif' }}
            >
              رمضان كريم
            </span>
            <div className="h-px bg-white/40 w-16 md:w-24" />
            <span className="text-2xl">✨</span>
          </div>
        </div>
      </div>

      {/* Small Tailwind Utility for icons */}
      <style jsx>{`
        .icon-btn {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          color: white;
        }

        .icon-btn:hover {
          background: rgba(251, 191, 36, 0.2);
          border-color: #fbbf24;
          transform: scale(1.1);
        }
      `}</style>
    </>
  )
}
