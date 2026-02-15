'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Register.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';


export default function RegisterClient() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        acceptTerms: false
    });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Rotate testimonials randomly every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial(Math.floor(Math.random() * TESTIMONIALS.length));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (password.length === 0) return { strength: 0, label: '', color: '' };
        if (password.length < 6) return { strength: 1, label: 'Çok zayıf', color: '#ef4444' };
        if (password.length < 8) return { strength: 2, label: 'Zayıf', color: '#f59e0b' };

        let strength = 2;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength === 3) return { strength: 3, label: 'Orta', color: '#eab308' };
        if (strength === 4) return { strength: 4, label: 'İyi', color: '#22c55e' };
        return { strength: 5, label: 'Güçlü', color: '#10b981' };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : name === 'email' ? value.toLowerCase() : value;

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
        } else if (formData.password.length < 8) {
            newErrors.password = 'Şifre en az 8 karakter olmalıdır';
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = 'Devam etmek için şartları kabul etmelisiniz';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            alert('Kayıt başarılı! (Demo - Backend entegrasyonu gerekli)');
        }, 1500);
    };

    const handleSocialLogin = (provider: string) => {
        alert(`${provider} ile giriş yapılacak (OAuth entegrasyonu gerekli)`);
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const testimonial = TESTIMONIALS[currentTestimonial];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>
                    <h2 className={styles.benefitsTitle}>Neden Emlak AIStudio?</h2>


                    <ul className={styles.benefitsList}>
                        <li className={styles.benefitItem}>
                            <div className={styles.benefitIcon}>✨</div>
                            <div>
                                <h3>Fotoğraf Geliştirme & Sanal Dekorasyon</h3>
                                <p>Düşük çözünürlüklü fotoğrafları 4K'ya yükseltin; boş odaları yapay zeka ile modern mobilyalarla döşeyin.</p>
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
                        <h1 className={styles.title}>Ücretsiz Başlayın</h1>
                        <p className={styles.subtitle}>
                            2 kredi ile deneyin
                        </p>
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
                            Google ile Kayıt Ol
                        </button>

                        <button
                            className={styles.socialButton}
                            onClick={() => handleSocialLogin('Apple')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            Apple ile Kayıt Ol
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>veya</span>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email Adresi
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                placeholder="ornek@email.com"
                                autoComplete="email"
                            />
                            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Şifre
                            </label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                    placeholder="En az 8 karakter"
                                    autoComplete="new-password"
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

                            {formData.password && (
                                <div className={styles.passwordStrength}>
                                    <div className={styles.strengthBar}>
                                        <div
                                            className={styles.strengthFill}
                                            style={{
                                                width: `${(passwordStrength.strength / 5) * 100}%`,
                                                backgroundColor: passwordStrength.color
                                            }}
                                        />
                                    </div>
                                    <span style={{ color: passwordStrength.color, fontSize: '0.875rem' }}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleInputChange}
                                className={styles.checkbox}
                            />
                            <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
                                <Link href="/terms" className={styles.link}>Kullanım Şartları</Link> ve{' '}
                                <Link href="/privacy" className={styles.link}>Gizlilik Politikası</Link>'nı kabul ediyorum
                            </label>
                        </div>
                        {errors.acceptTerms && <span className={styles.errorText}>{errors.acceptTerms}</span>}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className={styles.spinner} />
                                    Kaydediliyor...
                                </>
                            ) : (
                                'Ücretsiz Kayıt Ol'
                            )}
                        </button>
                    </form>


                    <p className={styles.loginLink}>
                        Zaten hesabınız var mı? <Link href="/login" className={styles.link}>Giriş Yapın</Link>
                    </p>
                </div>
            </div>
        </div >
    );
}
