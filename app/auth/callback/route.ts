import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Support ?next= for password reset redirect
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    // Flag recovery flow so reset-password page knows to show the update form
    const destination = next === '/reset-password'
        ? `${origin}${next}?recovery=1`
        : `${origin}${next}`;
    return NextResponse.redirect(destination);
}
