'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/LanguageProvider';
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser';
import { localizePath } from '@/lib/locale-routing';
import { persistStoredUserId } from '@/lib/client-auth';

export default function AuthCallbackPage() {
    const { t, lang } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    const nextPath = useMemo(() => {
        const raw = searchParams.get('next') || '/studio';
        return raw.startsWith('/') ? raw : '/studio';
    }, [searchParams]);

    useEffect(() => {
        let active = true;

        async function finalizeOAuth() {
            if (!isSupabaseBrowserConfigured()) {
                if (active) setError(t('Sosyal giriş şu an yapılandırılmamış. Lütfen Supabase Google ve Apple ayarlarını tamamlayın.'));
                return;
            }

            try {
                const code = searchParams.get('code');
                const callbackError = searchParams.get('error_description') || searchParams.get('error');

                if (callbackError) {
                    throw new Error(callbackError);
                }

                const supabase = getSupabaseBrowserClient();
                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) throw exchangeError;
                }

                const { data, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                const email = String(data.user?.email || '').trim().toLowerCase();
                if (!email) {
                    throw new Error(t('Sosyal girişten geçerli bir e-posta alınamadı.'));
                }

                const res = await fetch('/api/auth/social/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        provider: data.user?.app_metadata?.provider || 'oauth',
                    }),
                });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok || !payload.success) {
                    throw new Error(payload.error || t('Sosyal giriş tamamlanamadı.'));
                }

                persistStoredUserId(email);
                router.replace(localizePath(nextPath, lang));
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : t('Sosyal giriş tamamlanamadı.'));
            }
        }

        void finalizeOAuth();
        return () => {
            active = false;
        };
    }, [lang, nextPath, router, searchParams, t]);

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f8fafc' }}>
            <div style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: '2rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                    {error ? t('Sosyal giriş tamamlanamadı') : t('Giriş tamamlanıyor...')}
                </h1>
                <p style={{ marginTop: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
                    {error || t('Google veya Apple hesabınız doğrulanıyor. Lütfen bekleyin.')}
                </p>
            </div>
        </div>
    );
}
