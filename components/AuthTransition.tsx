'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg as LucideEgg } from 'lucide-react';

/**
 * @interface AuthTransitionProps
 * @property {boolean} isProcessing - State yang memicu kemunculan animasi saat proses login/autentikasi berlangsung.
 */
interface AuthTransitionProps {
  isProcessing: boolean;
}

export const AuthTransition: React.FC<AuthTransitionProps> = ({ isProcessing }) => {
  return (
    <AnimatePresence mode="wait">
      {isProcessing && (
        <motion.div
          key="auth-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            transition: { duration: 0.4, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* 1. Bouncing Brand Logo */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{
              scale: [0.4, 1.15, 1],
              opacity: 1
            }}
            transition={{
              type: "spring",
              stiffness: 350, // Memberikan pantulan yang lebih terkontrol
              damping: 15,    // Mencegah osilasi berlebih
              duration: 0.7,
              delay: 0.1
            }}
            className="flex items-center justify-center w-24 h-24 bg-zinc-900 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
          >
            <LucideEgg className="text-white w-12 h-12" strokeWidth={2.5} />
          </motion.div>

          {/* 2. Brand Identity Reveal */}
          <div className="mt-10 text-center select-none">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-black text-zinc-900 tracking-tighter"
            >
              PoultryOS
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-3 flex flex-col items-center"
            >
              <p className="text-zinc-400 font-semibold tracking-[0.3em] uppercase text-[9px] leading-none">
                Farm Intelligence Platform
              </p>
              {/* Decorative underline animation */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ delay: 0.9, duration: 1 }}
                className="h-[2px] bg-emerald-500 mt-4 rounded-full"
              />
            </motion.div>
          </div>

          {/* 3. Global Loading State (Visual Cue) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-16 flex flex-col items-center gap-3"
          >
            <div className="flex space-x-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Synchronizing Data
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};