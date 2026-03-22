'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';
import { persistStoredUserId } from '@/lib/client-auth';
import { useI18n } from '@/components/LanguageProvider';

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isPasswordlessLoginEmail(value: string): boolean {
    return normalizeEmail(value) === 'alidenizergun@gmail.com';
}

function persistAuth(email: string): void {
    persistStoredUserId(email);
}

export default function LoginClient() {
    const { t } = useI18n();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        const passwordlessLogin = isPasswordlessLoginEmail(normalizedEmail);

        if (!isValidEmail(normalizedEmail)) nextErrors.email = t('Gecerli bir e-posta adresi girin');
        if (!passwordlessLogin && password.length < 8) nextErrors.password = t('Sifre en az 8 karakter olmali');
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setErrors({ form: data.error ? t(data.error) : t('Giris basarisiz. Lutfen tekrar deneyin.') });
                return;
            }
            persistAuth(String(data.email || normalizedEmail));
            router.push('/studio');
        } catch {
            setErrors({ form: t('Giris basarisiz. Lutfen tekrar deneyin.') });
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
                                <h3>{t('Tek hesapla tum araclar')}</h3>
                                <p>{t('Fotoğraf geliştirme, dekorasyon, akilli esya silme ve ilan metni araclari ayni panelde sizi bekliyor.')}</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>02</div>
                            <div>
                                <h3>{t('Hizli kredi takibi')}</h3>
                                <p>{t('Giris yaptiginiz anda kalan kredi ve gecmis calismalarinizi gorebilir, aktif araclara hemen donebilirsiniz.')}</p>
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
                        <h1 className={styles.title}>{t('Giriş Yapın')}</h1>
                        <p className={styles.subtitle}>{t('E-posta adresiniz ve şifreniz ile hesabınıza girin.')}</p>
                    </div>

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
                                placeholder={isPasswordlessLoginEmail(email) ? t('Bu hesap için boş bırakabilirsiniz') : t('En az 8 karakter')}
                                autoComplete="current-password"
                            />
                            {errors.password ? <span className={styles.errorText}>{errors.password}</span> : null}
                        </div>

                        {errors.form ? <span className={styles.errorText}>{errors.form}</span> : null}

                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? (<><div className={styles.spinner} />{t('Giriş Yapılıyor...')}</>) : t('Giriş Yap')}
                        </button>
                    </form>

                    <p className={styles.registerLink}>
                        {t('Hesabınız yok mu?')} <Link href="/register">{t('Ücretsiz kayıt olun')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
