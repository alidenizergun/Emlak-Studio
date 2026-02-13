'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Login.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';

export default function LoginClient() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Rotate testimonials randomly
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial(Math.floor(Math.random() * TESTIMONIALS.length));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Clear error on change
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email adresi gereklidir';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Geçerli bir email adresi girin';
        }

        if (!formData.password) {
            newErrors.password = 'Şifre gereklidir';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            alert('Giriş başarılı! (Demo - Backend entegrasyonu gerekli)');
        }, 1500);
    };

    const handleSocialLogin = (provider: string) => {
        alert(`${provider} ile giriş yapılacak (OAuth entegrasyonu gerekli)`);
    };

    const testimonial = TESTIMONIALS[currentTestimonial];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>
                    <h2 className={styles.benefitsTitle}>Tekrar Hoş Geldiniz!</h2>

                    <ul className={styles.benefitsList}>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>🏡</div>
                            <div>
                                <h3>Portföy Yönetimi</h3>
                                <p>Tüm ilanlarınızı ve tasarımlarınızı tek yerden yönetin</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>💎</div>
                            <div>
                                <h3>Özel Stil Kütüphanesi</h3>
                                <p>Kendi tarzınızı oluşturun ve ilanlarınıza yansıtın</p>
                            </div>
                        </li>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>📈</div>
                            <div>
                                <h3>Performans Takibi</h3>
                                <p>İlanlarınızın aldığı etkileşimi ve dönüşümleri izleyin</p>
                            </div>
                        </li>
                    </ul>

                    <div className={styles.testimonial} key={currentTestimonial}>
                        <div className={styles.testimonialStars}>⭐⭐⭐⭐⭐</div>
                        <p className={styles.testimonialText}>
                            "{testimonial.text}"
                        </p>
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
                        <h1 className={styles.title}>Giriş Yapın</h1>
                        <p className={styles.subtitle}>Emlak AIStudio hesabınıza erişin</p>
                    </div>

                    <div className={styles.socialButtons}>
                        <button
                            className={styles.socialButton}
                            onClick={() => handleSocialLogin('Google')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google ile Giriş Yap
                        </button>

                        <button
                            className={styles.socialButton}
                            onClick={() => handleSocialLogin('Apple')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            Apple ile Giriş Yap
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>veya email ile</span>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>Email Adresi</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                placeholder="ornek@email.com"
                                autoComplete="username"
                            />
                            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                            <div className={styles.labelRow}>
                                <label htmlFor="password" className={styles.label}>Şifre</label>
                                <Link href="/forgot-password" className={styles.forgotPassword}>
                                    Şifremi Unuttum
                                </Link>
                            </div>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                                className={styles.checkbox}
                            />
                            <label htmlFor="rememberMe" className={styles.checkboxLabel}>Beni Hatırla</label>
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
                    </form>

                    <p className={styles.registerLink}>
                        Hesabınız yok mu? <Link href="/register" className={styles.link}>Şimdi Kaydolun</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
