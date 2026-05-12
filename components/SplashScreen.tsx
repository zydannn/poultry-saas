"use client";

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer    = setTimeout(() => setFadingOut(true), 2700);
    const completeTimer = setTimeout(() => onComplete(),      3200);
    return () => { clearTimeout(fadeTimer); clearTimeout(completeTimer); };
  }, [onComplete]);

  return (
    <div className={`splash-container ${fadingOut ? 'fade-out' : ''}`}>
      <style>{`
        .splash-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: #09090b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          opacity: 0;
          animation: splash-fade-in 0.25s ease forwards;
        }
        .splash-container.fade-out {
          animation: splash-fade-out 0.5s ease forwards;
        }

        /* ── Ring ── */
        .logo-wrapper {
          position: relative;
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ring {
          position: absolute;
          inset: 0;
          transform: rotate(-90deg);
        }
        .ring circle {
          fill: none;
          stroke: #10b981;
          stroke-width: 2.5;
          stroke-dasharray: 264;
          stroke-dashoffset: 264;
          animation: ring-draw 1.0s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
          stroke-linecap: round;
        }

        /* ── Egg icon ── */
        .logo-icon {
          width: 44px;
          height: 44px;
          opacity: 0;
          transform: scale(0.6);
          animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s forwards;
        }

        /* ── Text ── */
        .text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .app-name {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
          opacity: 0;
          transform: translateY(10px);
          animation: slide-up 0.4s ease-out 1.3s forwards;
        }
        .subtitle {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #10b981;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin: 0;
          opacity: 0;
          animation: fade-in-sub 0.35s ease-out 1.65s forwards;
        }

        /* ── Progress bar ── */
        .progress-track {
          width: 80px;
          height: 2px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
          opacity: 0;
          animation: fade-in-sub 0.1s ease-out 1.95s forwards;
        }
        .progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 2px;
          animation: progress-fill 0.8s ease-in-out 1.95s forwards;
        }

        /* ── Keyframes ── */
        @keyframes splash-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes splash-fade-out { from{opacity:1} to{opacity:0} }
        @keyframes fade-in-sub     { from{opacity:0} to{opacity:1} }

        @keyframes ring-draw {
          from { stroke-dashoffset: 264; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes pop-in {
          0%   { opacity:0; transform:scale(0.6); }
          65%  { transform:scale(1.12); opacity:1; }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes slide-up {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes progress-fill {
          from { width:0% }
          to   { width:100% }
        }
      `}</style>

      {/* Logo ring + Egg icon */}
      <div className="logo-wrapper">
        <svg className="ring" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="42" />
        </svg>

        {/* Lucide-style Egg icon — matches sidebar & login exactly */}
        <svg
          className="logo-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z" />
        </svg>
      </div>

      {/* Text */}
      <div className="text-wrapper">
        <h1 className="app-name">PoultryOS</h1>
        <p className="subtitle">Farm Intelligence Platform</p>
      </div>

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-fill" />
      </div>
    </div>
  );
}
