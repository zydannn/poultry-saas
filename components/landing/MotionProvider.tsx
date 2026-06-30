'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

// Membungkus pohon landing page agar seluruh animasi framer-motion
// otomatis mengikuti preferensi "reduce motion" dari sistem pengguna.
export default function MotionProvider({ children }: { children: ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
