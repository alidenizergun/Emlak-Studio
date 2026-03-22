'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Register.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';
import { persistStoredUserId } from '@/lib/client-auth';
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';
import { localizePath } from '@/lib/locale-routing';
import AuthSocialButtons from '@/components/AuthSocialButtons';

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function persistAuth(email: string): void {
    persistStoredUserId(email);
}

export default function RegisterClient() {
    const { t, lang } = useI18n();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial(Math.floor(Math.random() * TESTIMONIALS.length));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = normalizeEmail(email);
        const nextErrors: Record<string, string> = {};

        if (!isValidEmail(normalizedEmail)) nextErrors.email = t('Gecerli bir e-posta adresi girin');
        if (password.length < 8) nextErrors.password = t('Sifre en az 8 karakter olmali');
        if (!acceptTerms) nextErrors.acceptTerms = t('Devam etmek icin sartlari kabul etmelisiniz');
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setErrors({ form: data.error ? t(data.error) : t('Kayit basarisiz. Lutfen tekrar deneyin.') });
                return;
            }
            persistAuth(String(data.email || normalizedEmail));
            router.push(localizePath('/studio', lang));
        } catch {
            setErrors({ form: t('Kayit basarisiz. Lutfen tekrar deneyin.') });
        } finally {
            setIsLoading(false);
        }
    };

    const testimonial = TESTIMONIALS[currentTestimonial];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>
                    <ul className={styles.benefitsList}>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>01</div>
                            <div>
                                <h3>{t('Hizli hesap olusturma')}</h3>
                                <p>{t('E-posta ve sifre ile saniyeler icinde hesabinizi olusturun, aktif araclara hemen ulasin.')}</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>02</div>
                            <div>
                                <h3>{t('MVP odakli kullanim')}</h3>
                                <p>{t('Ilk musteriler icin kredi ve paket tanimlarini birlikte yonetiyor, aktif araclari hizla yayina hazirliyoruz.')}</p>
                            </div>
                        </li>
                    </ul>

                    <div className={styles.testimonial}>
                        <p className={styles.testimonialText}>“{testimonial.text}”</p>
                        <div className={styles.authorInfo}>
                            <p className={styles.testimonialAuthor}>{testimonial.author}</p>
                            <p className={styles.testimonialCompany}>{testimonial.company}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h1 className={styles.title}>{t('Ücretsiz Başlayın')}</h1>
                        <p className={styles.subtitle}>{t('E-posta adresiniz ve şifreniz ile hesabınızı oluşturun.')}</p>
                    </div>

                    <AuthSocialButtons
                        className={styles.socialBlock}
                        dividerClassName={styles.socialDivider}
                        dividerLineClassName={styles.socialDividerLine}
                        dividerTextClassName={styles.socialDividerText}
                        stackClassName={styles.socialStack}
                        buttonClassName={styles.socialButton}
                        iconClassName={styles.socialIcon}
                        onError={(message) => setErrors({ form: t(message) })}
                    />

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>{t('E-posta')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                                }}
                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                placeholder="ornek@eposta.com"
                                autoComplete="email"
                            />
                            {errors.email ? <span className={styles.errorText}>{errors.email}</span> : null}
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>{t('Şifre')}</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                                }}
                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                placeholder={t('En az 8 karakter')}
                                autoComplete="new-password"
                            />
                            {errors.password ? <span className={styles.errorText}>{errors.password}</span> : null}
                        </div>

                        <label className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={acceptTerms}
                                onChange={(e) => {
                                    setAcceptTerms(e.target.checked);
                                    if (errors.acceptTerms) setErrors((prev) => ({ ...prev, acceptTerms: '' }));
                                }}
                            />
                            <span className={styles.checkboxLabel}>{t('Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.')}</span>
                        </label>
                        {errors.acceptTerms ? <span className={styles.errorText}>{errors.acceptTerms}</span> : null}
                        {errors.form ? <span className={styles.errorText}>{errors.form}</span> : null}

                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? (<><div className={styles.spinner} />{t('Hesap Oluşturuluyor...')}</>) : t('Hesap Oluştur')}
                        </button>
                    </form>

                    <p className={styles.loginLink}>
                        {t('Hesabınız var mı?')} <LocalizedLink href="/login">{t('Giriş yapın')}</LocalizedLink>
                    </p>
                </div>
            </div>
        </div>
    );
}
