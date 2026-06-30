import AppShell from '@/components/AppShell';
import DashboardContent from '@/components/DashboardContent';
import AiAssistant from '@/components/AiAssistant';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <AppShell userEmail={user.email}>
      <DashboardContent />
      <AiAssistant />
    </AppShell>
  );
}
