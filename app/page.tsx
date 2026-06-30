import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import MotionProvider from '@/components/landing/MotionProvider';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import VideoSection from '@/components/landing/VideoSection';
import ScreenshotsSection from '@/components/landing/ScreenshotsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WhySection from '@/components/landing/WhySection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CtaSection from '@/components/landing/CtaSection';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // User sudah login → langsung ke dashboard
  if (user) redirect('/dashboard');

  return (
    <MotionProvider>
      <div className="min-h-screen bg-white">
        <LandingNav />
        <main>
          <HeroSection />
          <ProblemSection />
          <VideoSection />
          <ScreenshotsSection />
          <FeaturesSection />
          <WhySection />
          <TestimonialsSection />
          <CtaSection />
        </main>
      </div>
    </MotionProvider>
  );
}
