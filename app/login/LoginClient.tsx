'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';

function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && /^5[0-9]/.test(digits);
}

export default function LoginClient() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial(Math.floor(Math.random() * TESTIMONIALS.length));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(normalizePhone(e.target.value));
        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
    };

    const handleSendOtp = async () => {
        if (!isValidPhone(phone)) {
            setErrors({ phone: 'Geçerli bir cep telefonu numarası girin (5XX XXX XX XX)' });
            return;
        }
        setErrors({});
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
            });
            if (!res.ok) throw new Error('Gönderilemedi');
            setOtpSent(true);
            setResendCooldown(60);
        } catch {
            setErrors({ phone: 'Kod gönderilemedi. Lütfen tekrar deneyin.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!otpSent || !isValidPhone(phone)) {
            newErrors.phone = 'Önce SMS ile kod alın';
        } else if (otpCode.replace(/\D/g, '').length !== 6) {
            newErrors.otp = '6 haneli kodu girin';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.replace(/\D/g, ''), code: otpCode.replace(/\D/g, '') }),
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_authed', '1');
                    window.localStorage.setItem('emlak_user_phone', phone.replace(/\D/g, ''));
                }
                router.push('/studio');
            } else {
                setErrors({ otp: data.error || 'Kod geçersiz veya süresi dolmuş.' });
            }
        } catch {
            setErrors({ otp: 'Doğrulama başarısız. Lütfen tekrar deneyin.' });
        } finally {
            setIsLoading(false);
        }
    };

    const testimonial = TESTIMONIALS[currentTestimonial];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h1 className={styles.title}>Giriş Yapın</h1>
                        <p className={styles.subtitle}>
                            Cep telefonu numaranız ile giriş yapın. SMS ile doğrulama kodu göndereceğiz.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="phone" className={styles.label}>
                                Cep Telefonu
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                placeholder="5XX XXX XX XX"
                                autoComplete="tel"
                                maxLength={12}
                                disabled={otpSent}
                            />
                            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                            {!otpSent ? (
                                <button
                                    type="button"
                                    className={styles.sendOtpBtn}
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Gönderiliyor...' : 'SMS ile kod gönder'}
                                </button>
                            ) : (
                                <p className={styles.otpSentNote}>
                                    {phone} numarasına 6 haneli kod gönderildi.
                                </p>
                            )}
                        </div>

                        {otpSent && (
                            <>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="otp" className={styles.label}>
                                        Doğrulama Kodu
                                    </label>
                                    <input
                                        type="text"
                                        id="otp"
                                        inputMode="numeric"
                                        value={otpCode}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtpCode(v);
                                            if (errors.otp) setErrors((p) => ({ ...p, otp: '' }));
                                        }}
                                        className={`${styles.input} ${styles.otpInput} ${errors.otp ? styles.inputError : ''}`}
                                        placeholder="000000"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                    />
                                    {errors.otp && <span className={styles.errorText}>{errors.otp}</span>}
                                    {resendCooldown > 0 ? (
                                        <p className={styles.resendNote}>Tekrar kod gönder: {resendCooldown} sn</p>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.resendButton}
                                            onClick={handleSendOtp}
                                            disabled={isLoading}
                                        >
                                            Kodu tekrar gönder
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className={styles.spinner} />
                                            Giriş Yapılıyor...
                                        </>
                                    ) : (
                                        'Giriş Yap'
                                    )}
                                </button>
                            </>
                        )}
                    </form>

                    <p className={styles.registerLink}>
                        Hesabınız yok mu? <Link href="/register" className={styles.link}>Şimdi Kayıt Olun</Link>
                    </p>
                </div>
            </div>

            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>
                    <ul className={styles.benefitsList}>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>✨</div>
                            <div>
                                <h3>Fotoğraf Geliştirme & Dekorasyon Stüdyosu</h3>
                                <p>Düşük çözünürlüklü fotoğrafları 4K&apos;ya yükseltin; boş odaları yapay zeka ile modern mobilyalarla döşeyin.</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>⚡</div>
                            <div>
                                <h3>Saniyeler İçinde Sonuç</h3>
                                <p>Manuel çekim veya dekoratör beklemeden ilan görsellerinizi tek platformda hazırlayın.</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>💰</div>
                            <div>
                                <h3>Maliyet Tasarrufu</h3>
                                <p>Profesyonel fotoğrafçı ve sanal dekorasyon hizmetlerine kıyasla çok daha uygun maliyetle çalışın.</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>🏆</div>
                            <div>
                                <h3>Tüm Araçlar Tek Yerde</h3>
                                <p>Geliştirme, sanal dekorasyon, gökyüzü değiştirme, ilan metni ve daha fazlası—emlak ilanlarınız için ihtiyacınız olan her şey.</p>
                            </div>
                        </li>
                    </ul>
                    <div className={styles.testimonial} key={currentTestimonial}>
                        <div className={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
                        <p className={styles.testimonialText}>&quot;{testimonial.text}&quot;</p>
                        <div className={styles.authorInfo}>
                            <p className={styles.testimonialAuthor}>{testimonial.author}</p>
                            <p className={styles.testimonialCompany}>{testimonial.company}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
