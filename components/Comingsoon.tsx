"use client"
import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Phone, MapPin } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const launchDateString = process.env.NEXT_PUBLIC_LAUNCH_DATE || '2026-03-01 00:00:00';
      const launchDate = new Date(launchDateString).getTime();
      const difference = launchDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <>
      {/* Google Fonts Import */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Raleway:wght@300;400;600;700&family=Lora:wght@400;500&family=Orbitron:wght@700;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background.jpg)' }}
        />
        
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 w-full max-w-5xl mx-auto py-8 text-center">
          {/* Logo */}
          <div className="mb-8 md:mb-12">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/95 backdrop-blur-sm border-4 border-amber-400 rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-8">
              <img 
                src="/log.png" 
                alt="Melek Coiff" 
                className="w-full h-full object-contain rounded-2xl" 
              />
            </div>
            
            {/* Title with Playfair Display - elegant serif */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 drop-shadow-2xl" style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '0.02em' }}>
              Melek Coiff
            </h1>
            
            {/* Subtitle with Raleway - modern sans */}
            <p className="text-2xl md:text-3xl lg:text-4xl text-amber-400 font-light mb-4 drop-shadow-lg" style={{ fontFamily: '"Raleway", sans-serif', letterSpacing: '0.1em' }}>
              BIENTÔT DISPONIBLE
            </p>
            
            {/* Description with Lora - readable serif */}
            <p className="text-lg md:text-xl lg:text-2xl text-white max-w-3xl mx-auto px-4 drop-shadow-md" style={{ fontFamily: '"Lora", serif' }}>
              Une nouvelle façon de gérer votre attente
            </p>
          </div>

          {/* Countdown Timer - Fixed Layout to Prevent Wrapping */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 drop-shadow-lg" style={{ fontFamily: '"Raleway", sans-serif', letterSpacing: '0.05em' }}>
              LANCEMENT DANS
            </h2>
            
            {/* Countdown Container - prevents wrapping */}
            <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6 max-w-5xl mx-auto overflow-x-auto">
              {/* Days */}
              <div className="text-center flex-shrink-0">
                <div className="text-4xl md:text-6xl lg:text-8xl font-bold bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: '"Orbitron", monospace' }}>
                  {mounted ? String(timeLeft.days).padStart(2, '0') : '--'}
                </div>
                <div className="text-xs md:text-sm lg:text-base text-white uppercase tracking-widest mt-1 md:mt-2 font-semibold drop-shadow-md" style={{ fontFamily: '"Raleway", sans-serif' }}>
                  Jours
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-amber-400 drop-shadow-2xl flex-shrink-0 -mt-6 md:-mt-8" style={{ fontFamily: '"Orbitron", monospace' }}>
                :
              </div>
              
              {/* Hours */}
              <div className="text-center flex-shrink-0">
                <div className="text-4xl md:text-6xl lg:text-8xl font-bold bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: '"Orbitron", monospace' }}>
                  {mounted ? String(timeLeft.hours).padStart(2, '0') : '--'}
                </div>
                <div className="text-xs md:text-sm lg:text-base text-white uppercase tracking-widest mt-1 md:mt-2 font-semibold drop-shadow-md" style={{ fontFamily: '"Raleway", sans-serif' }}>
                  Heures
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-amber-400 drop-shadow-2xl flex-shrink-0 -mt-6 md:-mt-8" style={{ fontFamily: '"Orbitron", monospace' }}>
                :
              </div>
              
              {/* Minutes */}
              <div className="text-center flex-shrink-0">
                <div className="text-4xl md:text-6xl lg:text-8xl font-bold bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: '"Orbitron", monospace' }}>
                  {mounted ? String(timeLeft.minutes).padStart(2, '0') : '--'}
                </div>
                <div className="text-xs md:text-sm lg:text-base text-white uppercase tracking-widest mt-1 md:mt-2 font-semibold drop-shadow-md" style={{ fontFamily: '"Raleway", sans-serif' }}>
                  Minutes
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-4xl md:text-6xl lg:text-8xl font-bold text-amber-400 drop-shadow-2xl flex-shrink-0 -mt-6 md:-mt-8" style={{ fontFamily: '"Orbitron", monospace' }}>
                :
              </div>
              
              {/* Seconds */}
              <div className="text-center flex-shrink-0">
                <div className="text-4xl md:text-6xl lg:text-8xl font-bold bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: '"Orbitron", monospace' }}>
                  {mounted ? String(timeLeft.seconds).padStart(2, '0') : '--'}
                </div>
                <div className="text-xs md:text-sm lg:text-base text-white uppercase tracking-widest mt-1 md:mt-2 font-semibold drop-shadow-md" style={{ fontFamily: '"Raleway", sans-serif' }}>
                  Secondes
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-white mb-6 drop-shadow-lg" style={{ fontFamily: '"Raleway", sans-serif' }}>
              Suivez-nous
            </p>
            <div className="flex items-center justify-center gap-6 md:gap-8">
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/mvleek__coiff_93/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-amber-400/20 hover:border-amber-400 transition-all duration-300 hover:scale-110 shadow-xl"
              >
                <Instagram className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </a>
              
              {/* Facebook */}
              <a 
                href="https://www.facebook.com/malek.boulares.50" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-amber-400/20 hover:border-amber-400 transition-all duration-300 hover:scale-110 shadow-xl"
              >
                <Facebook className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </a>
              
              {/* Phone */}
              <a 
                href="tel:+21652265816" 
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-amber-400/20 hover:border-amber-400 transition-all duration-300 hover:scale-110 shadow-xl"
              >
                <Phone className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </a>
              
              {/* Location */}
              <a 
                href="https://maps.app.goo.gl/XQp8N7fo7aTGjnRi7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-amber-400/20 hover:border-amber-400 transition-all duration-300 hover:scale-110 shadow-xl"
              >
                <MapPin className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </a>
            </div>
          </div>

          {/* Ramadan Message */}
          <div className="flex items-center justify-center gap-4 text-amber-400">
            <span className="text-3xl md:text-4xl drop-shadow-lg">🌙</span>
            <div className="h-px bg-white/40 flex-1 max-w-xs"></div>
            <span className="text-xl md:text-2xl text-white drop-shadow-md" style={{ fontFamily: '"Amiri", serif' }}>
              رمضان كريم
            </span>
            <div className="h-px bg-white/40 flex-1 max-w-xs"></div>
            <span className="text-3xl md:text-4xl drop-shadow-lg">✨</span>
          </div>
        </div>
      </div>
    </>
  );
}