"use client"
import { useState, useEffect, useRef } from 'react';

// ===== PIN LOCK SCREEN =====
function PinLockScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ⚠️ CHANGE THIS TO YOUR DESIRED PIN
  const CORRECT_PIN = '123456';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const triggerError = () => {
    setError(true);
    setShake(true);
    // Remove shake class after animation so it can re-trigger on next attempt
    setTimeout(() => setShake(false), 450);
    setTimeout(() => {
      setError(false);
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }, 600);
  };

  const triggerSuccess = () => {
    setSuccess(true);
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminAuthTime', Date.now().toString());
    setTimeout(() => onSuccess(), 700);
  };

  const checkPin = (digits: string[]) => {
    if (digits.join('') === CORRECT_PIN) triggerSuccess();
    else triggerError();
  };

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value) checkPin(newPin);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (pin[index]) {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      } else if (index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newPin = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setPin(newPin);
    if (pasted.length === 6) checkPin(newPin);
    else inputRefs.current[pasted.length]?.focus();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0B1120' }}
    >
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-xs">
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow:
              '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* Amber accent bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, #f59e0b 40%, #d97706 60%, transparent)',
            }}
          />

          <div className="px-8 pt-8 pb-9">
            {/* Lock icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.12))',
                  border: '1px solid rgba(245,158,11,0.30)',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
                }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="#f59e0b"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-white tracking-tight mb-1">
                Accès Administrateur
              </h1>
              <p className="text-white/40 text-sm">
                Entrez votre code à 6 chiffres
              </p>
            </div>

            {/* ── PIN row ──
                Only the shake runs on this wrapper.
                Error/success feedback is handled purely via CSS transition
                on each cell's background + border — no box-shadow glow on
                the row, which looked messy bleeding into the gaps.
            */}
            <div
              className={`flex gap-2.5 justify-center mb-7 ${shake ? 'pin-shake' : ''}`}
            >
              {pin.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    aria-label={`Chiffre ${index + 1}`}
                    className="w-10 h-12 rounded-xl focus:outline-none caret-transparent select-none"
                    style={{
                      transition: 'background 0.18s ease, border-color 0.18s ease',
                      background: error
                        ? 'rgba(239,68,68,0.12)'
                        : success
                        ? 'rgba(16,185,129,0.12)'
                        : digit
                        ? 'rgba(245,158,11,0.12)'
                        : 'rgba(255,255,255,0.06)',
                      border: error
                        ? '1.5px solid rgba(239,68,68,0.55)'
                        : success
                        ? '1.5px solid rgba(16,185,129,0.55)'
                        : digit
                        ? '1.5px solid rgba(245,158,11,0.45)'
                        : '1.5px solid rgba(255,255,255,0.12)',
                      color: 'transparent',
                    }}
                  />
                  {/* Security dot — hides the actual digit value */}
                  {digit && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          transition: 'background 0.18s ease',
                          background: error
                            ? '#ef4444'
                            : success
                            ? '#10b981'
                            : '#f59e0b',
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Status line */}
            <div className="min-h-5 text-center">
              {error && (
                <p className="text-sm font-medium" style={{ color: 'rgba(239,68,68,0.85)' }}>
                  Code incorrect — réessayez
                </p>
              )}
              {success && (
                <p className="text-sm font-medium" style={{ color: 'rgba(16,185,129,0.90)' }}>
                  ✓ Accès accordé
                </p>
              )}
              {!error && !success && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
                  🔒 Accès réservé au personnel autorisé
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subtle card reflection */}
        <div
          className="mx-6 h-4 rounded-b-3xl"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)',
            filter: 'blur(4px)',
          }}
        />
      </div>

      {/*
        Self-contained animation — deliberately avoids global.css shake-glow because:
        1. The global glow uses green (rgba(16,185,129)) which is the SUCCESS colour,
           completely wrong semantics on a wrong-PIN error.
        2. It double-pulses (fires at 15% and 45%) which looks jittery on small cells.
        3. box-shadow on a flex row bleeds into the gaps between cells, looking messy.

        Instead: a tight snappy shake on the row only (cubic-bezier gives it a
        physical "rebound" feel), and the error/success colour change is handled
        via CSS transitions directly on each cell — clean, precise, no side effects.
      */}
      <style>{`
        @keyframes pin-shake {
          0%   { transform: translateX(0);    }
          12%  { transform: translateX(-7px); }
          25%  { transform: translateX(6px);  }
          38%  { transform: translateX(-5px); }
          52%  { transform: translateX(4px);  }
          65%  { transform: translateX(-2px); }
          78%  { transform: translateX(2px);  }
          100% { transform: translateX(0);    }
        }
        .pin-shake {
          animation: pin-shake 0.42s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}

// ===== LOADING SCREEN =====
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0B1120' }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg className="w-10 h-10 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12" cy="12" r="10"
            stroke="rgba(245,158,11,0.15)"
            strokeWidth="3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-white/30 text-sm tracking-wide">Chargement…</p>
      </div>
    </div>
  );
}

// ===== PIN PROTECTION WRAPPER =====
export default function PinProtection({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const authTime = localStorage.getItem('adminAuthTime');

    if (auth === 'true' && authTime) {
      const EIGHT_HOURS = 8 * 60 * 60 * 1000;
      if (Date.now() - parseInt(authTime) < EIGHT_HOURS) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminAuthTime');
      }
    }

    setLoading(false);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!authenticated) return <PinLockScreen onSuccess={() => setAuthenticated(true)} />;
  return <>{children}</>;
}