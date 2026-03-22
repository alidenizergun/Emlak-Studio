"use client";

import { useState } from "react";
import styles from "./Help.module.css";
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';

const CATEGORIES = [
    {
        title: "Başlarken",
        description: "Kayıt, giriş ve ilk adımlar.",
        href: "#baslarken",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
            </svg>
        ),
    },
    {
        title: "Fotoğraf Geliştirme",
        description: "Görsel iyileştirme, 4K yükseltme ve kullanım.",
        href: "#fotograf",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
            </svg>
        ),
    },
    {
        title: "Sanal Dekorasyon",
        description: "Oda tipi, tarz seçimi ve sonuç indirme.",
        href: "#sanal-dekorasyon",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h20" />
                <path d="M4 20v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
        ),
    },
    {
        title: "Hesaplar & Ödeme",
        description: "Kredi, abonelik, fatura ve iptal.",
        href: "#hesaplar",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
            </svg>
        ),
    },
    {
        title: "İletişim",
        description: "Destek ekibi ve iletişim kanalları.",
        href: "/contact",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
];

const FAQ_ITEMS = [
    {
        question: "Studio Estate’ya nasıl kayıt olurum?",
        answer: "Ana sayfadaki \"Ücretsiz Deneyin\" veya \"Kayıt Ol\" butonuna tıklayın. E-posta adresiniz ve şifreniz ile hesabınızı oluşturabilirsiniz. Kayıt sonrası hemen aktif araçları kullanmaya başlayabilirsiniz.",
    },
    {
        question: "Kredi nedir? Nasıl kullanılır?",
        answer: "1 kredi, 1 görsel işlemi (örneğin 1 odanın sanal dekorasyonu veya 1 fotoğrafın geliştirilmesi) anlamına gelir. Abonelik planınıza göre aylık kredi alırsınız. Kredilerinizi panelden takip edebilir, işlem yaptıkça düşer.",
    },
    {
        question: "Fotoğraf Geliştirme’de hangi formatlar destekleniyor?",
        answer: "JPG, PNG ve WebP formatları desteklenmektedir. Önerilen minimum çözünürlük 800x600’dür. Yükleme sonrası çözünürlük yükseltme, parlaklık ve netlik gibi seçenekleri işaretleyip \"Seçilenleri Uygula\" ile işlemi başlatabilirsiniz.",
    },
    {
        question: "Sanal Dekorasyon'da oda tipi ve tarz nasıl seçilir?",
        answer: "Boş oda fotoğrafınızı yükledikten sonra \"Oda Tipi\" (Salon, Yatak Odası, Mutfak vb.) ve \"Dekorasyon Tarzı\" (Modern, Klasik, Minimal vb.) alanlarından seçim yapın. İsterseniz \"Studio Estate Seçsin\" ile otomatik öneri alabilirsiniz. \"Dekorasyon Oluştur\" butonuyla işlemi başlatın.",
    },
    {
        question: "İşlem ne kadar sürer?",
        answer: "Çoğu işlem 30 saniye içinde tamamlanır. Yoğunluk durumunda birkaç dakika sürebilir. Tamamlandığında sonucu ekranda görüntüleyebilir ve indirebilirsiniz.",
    },
    {
        question: "Aboneliğimi nasıl iptal ederim?",
        answer: "Hesap ayarlarından \"Paket ve Aktivasyon\" bölümüne giderek paketinizi kapatabilirsiniz. MVP döneminde aktivasyonlar manuel olduğu için değişiklikler destek ekibi ile birlikte hızlıca yönetilir.",
    },
    {
        question: "Destek ekibine nasıl ulaşırım?",
        answer: "Yardım merkezinde cevabınızı bulamadıysanız İletişim sayfamızdan bize ulaşabilirsiniz. E-posta ve canlı destek (planınıza göre) seçenekleri mevcuttur.",
    },
];

export default function HelpClient() {
    const { t } = useI18n();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className={`container ${styles.page}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('Yardım Merkezi')}</h1>
                <p className={styles.subtitle}>
                    {t('Studio Estate ile ilgili sık sorulan sorulara yanıtlar ve kullanım rehberleri. Aradığınız konuyu aşağıdaki kategorilerden veya SSS bölümünden bulabilirsiniz.')}
                </p>
                <div className={styles.searchWrap}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon} aria-hidden>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder={t('Konu veya soru ara...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label={t('Yardım ara')}
                        />
                    </div>
                </div>
            </header>

            <section className={styles.categories} aria-label="Yardım kategorileri">
                {CATEGORIES.map((cat) => (
                    <LocalizedLink key={cat.title} href={cat.href} className={styles.card}>
                        <div className={styles.cardIcon}>{cat.icon}</div>
                        <h2 className={styles.cardTitle}>{t(cat.title)}</h2>
                        <p className={styles.cardDesc}>{t(cat.description)}</p>
                    </LocalizedLink>
                ))}
            </section>

            <section id="sss" aria-labelledby="sss-title">
                <h2 id="sss-title" className={styles.sectionTitle}>
                    {t('Sıkça Sorulan Sorular')}
                </h2>
                <div className={styles.faqList}>
                    {FAQ_ITEMS.map((item, index) => {
                        const isOpen = openFaq === index;
                        const matchSearch =
                            !searchQuery ||
                            t(item.question).toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t(item.answer).toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchSearch) return null;

                        return (
                            <div
                                key={index}
                                className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}
                            >
                                <button
                                    type="button"
                                    className={styles.faqQuestion}
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-answer-${index}`}
                                    id={`faq-question-${index}`}
                                >
                                    {t(item.question)}
                                    <span className={styles.faqChevron} aria-hidden>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </span>
                                </button>
                                <div
                                    id={`faq-answer-${index}`}
                                    className={styles.faqAnswer}
                                    role="region"
                                    aria-labelledby={`faq-question-${index}`}
                                    hidden={!isOpen}
                                >
                                    <div className={styles.faqAnswerInner}>{t(item.answer)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className={styles.ctaBlock}>
                <h3 className={styles.ctaTitle}>{t('Cevabını bulamadın mı?')}</h3>
                <p className={styles.ctaText}>
                    {t('Destek ekibimiz size yardımcı olmaktan mutluluk duyar. İletişim sayfamızdan bize ulaşın.')}
                </p>
                <LocalizedLink href="/contact" className={styles.ctaButton}>
                    {t('İletişime Geç')}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </LocalizedLink>
            </div>
        </div>
    );
}
