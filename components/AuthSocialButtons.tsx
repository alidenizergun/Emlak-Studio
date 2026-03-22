'use client';

import { useState } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import { localizePath } from '@/lib/locale-routing';
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser';

type Provider = 'google' | 'apple';

interface AuthSocialButtonsProps {
    className?: string;
    dividerClassName?: string;
    dividerLineClassName?: string;
    dividerTextClassName?: string;
    stackClassName?: string;
    buttonClassName?: string;
    iconClassName?: string;
    onError?: (message: string) => void;
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2A9.8 9.8 0 0 0 2.2 12 9.8 9.8 0 0 0 12 21.8c5.7 0 9.5-4 9.5-9.7 0-.7-.1-1.3-.2-1.9H12Z"/>
            <path fill="#34A853" d="M2.2 12c0 1.6.4 3.2 1.2 4.5l3.6-2.8A5.9 5.9 0 0 1 6 12c0-.6.1-1.2.3-1.7L2.7 7.5A9.8 9.8 0 0 0 2.2 12Z"/>
            <path fill="#FBBC05" d="M12 21.8c2.7 0 4.9-.9 6.5-2.5l-3.2-2.5c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4l-3.7 2.8A9.8 9.8 0 0 0 12 21.8Z"/>
            <path fill="#4285F4" d="M18.5 19.3c1.9-1.7 3-4.3 3-7.2 0-.7-.1-1.3-.2-1.9H12v3.9h5.5c-.2 1-.8 2.5-3 3.4l4 1.8Z"/>
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="currentColor"
                d="M16.68 12.72c.01-2.1 1.72-3.1 1.8-3.15-.98-1.43-2.5-1.63-3.03-1.66-1.29-.13-2.52.76-3.18.76-.66 0-1.67-.74-2.74-.72-1.41.02-2.72.82-3.44 2.08-1.47 2.53-.37 6.27 1.06 8.34.7 1.01 1.54 2.15 2.65 2.11 1.06-.04 1.46-.68 2.74-.68 1.28 0 1.64.68 2.76.66 1.14-.02 1.86-1.03 2.56-2.05.8-1.16 1.13-2.28 1.15-2.33-.03-.01-2.19-.84-2.21-3.36Zm-2.06-5.61c.58-.7.98-1.67.87-2.64-.84.03-1.86.56-2.46 1.26-.54.62-1.01 1.61-.88 2.56.94.07 1.89-.47 2.47-1.18Z"
            />
        </svg>
    );
}

export default function AuthSocialButtons({
    className,
    dividerClassName,
    dividerLineClassName,
    dividerTextClassName,
    stackClassName,
    buttonClassName,
    iconClassName,
    onError,
}: AuthSocialButtonsProps) {
    const { t, lang } = useI18n();
    const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

    const startSocialLogin = async (provider: Provider) => {
        if (!isSupabaseBrowserConfigured()) {
            onError?.(t('Sosyal giriş şu an yapılandırılmamış. Lütfen Supabase Google ve Apple ayarlarını tamamlayın.'));
            return;
        }

        setLoadingProvider(provider);
        try {
            const supabase = getSupabaseBrowserClient();
            const redirectTo = `${window.location.origin}${localizePath('/auth/callback', lang)}?next=/studio`;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
                },
            });

            if (error) {
                throw error;
            }

            if (data?.url) {
                window.location.assign(data.url);
                return;
            }

            throw new Error('OAuth yönlendirmesi başlatılamadı.');
        } catch (error) {
            const message = error instanceof Error ? error.message : t('Sosyal giriş başlatılamadı.');
            onError?.(message);
            setLoadingProvider(null);
        }
    };

    return (
        <div className={className}>
            <div className={dividerClassName}>
                <span className={dividerLineClassName} aria-hidden="true" />
                <span className={dividerTextClassName}>{t('veya')}</span>
                <span className={dividerLineClassName} aria-hidden="true" />
            </div>
            <div className={stackClassName}>
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => startSocialLogin('google')}
                    disabled={loadingProvider !== null}
                >
                    <span className={iconClassName}><GoogleIcon /></span>
                    <span>
                        {loadingProvider === 'google'
                            ? t('Google ile yönlendiriliyor...')
                            : t('Google ile devam et')}
                    </span>
                </button>
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => startSocialLogin('apple')}
                    disabled={loadingProvider !== null}
                >
                    <span className={iconClassName}><AppleIcon /></span>
                    <span>
                        {loadingProvider === 'apple'
                            ? t('Apple ile yönlendiriliyor...')
                            : t('Apple ile devam et')}
                    </span>
                </button>
            </div>
        </div>
    );
}
