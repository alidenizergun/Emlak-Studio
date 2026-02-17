'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import styles from './IlanMetni.module.css';

export interface IlanBilgileri {
    lokasyon: string;
    metrekare: string;
    odaSayisi: string;
    banyoSayisi: string;
    kat: string;
    binaYasi: string;
    isitma: string;
    kullanim: 'satilik' | 'kiralik';
    fiyat: string;
    ekNotlar: string;
}

const defaultForm: IlanBilgileri = {
    lokasyon: '',
    metrekare: '',
    odaSayisi: '',
    banyoSayisi: '',
    kat: '',
    binaYasi: '',
    isitma: '',
    kullanim: 'satilik',
    fiyat: '',
    ekNotlar: '',
};

export default function IlanMetniClient() {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [form, setForm] = useState<IlanBilgileri>(defaultForm);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultText, setResultText] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [fileUrl]);

    const handleImageSelect = (selected: File) => {
        if (!selected) return;
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(selected);
        setFileUrl(URL.createObjectURL(selected));
        setResultText(null);
    };

    const updateField = (field: keyof IlanBilgileri, value: string | 'satilik' | 'kiralik') => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setResultText(null);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setResultText(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('ilanBilgileri', JSON.stringify(form));
            const response = await fetch('/api/ilan-metni', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.text) {
                setResultText(data.text);
            } else {
                setResultText(data.error || 'Metin oluşturulamadı. Lütfen tekrar deneyin.');
            }
        } catch {
            setResultText('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(null);
        setFileUrl(null);
        setForm(defaultForm);
        setResultText(null);
    };

    const canSubmit = file && form.lokasyon.trim() && form.metrekare.trim();

    if (!mounted) {
        return (
            <div className={styles.pageContainer} style={{ textAlign: 'center', padding: '3rem' }}>
                Yükleniyor...
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>İlan Metni Oluşturucu</h1>
                    <p className={styles.description}>
                        Fotoğrafları yükleyin ve ilan bilgilerini girin; yapay zeka profesyonel ilan metni üretsin.
                    </p>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                label="Fotoğrafları Buraya Tıklayıp Yükleyin"
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {resultText ? (
                                <div className={styles.resultTextWrap}>
                                    <textarea
                                        className={styles.resultText}
                                        readOnly
                                        value={resultText}
                                        rows={12}
                                    />
                                    <div className={styles.resultActions}>
                                        <button
                                            type="button"
                                            className={styles.resetBtn}
                                            onClick={handleReset}
                                        >
                                            Baştan Başla
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={fileUrl || ''} alt="Önizleme" className={styles.previewImage} />
                                    <button type="button" className={styles.changeImageBtn} onClick={handleReset}>
                                        Farklı Görsel Seç
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.panelTitle}>İlan bilgileri</div>
                        <div className={styles.formSection}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Lokasyon / Adres *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Örn: Kadıköy, İstanbul"
                                    value={form.lokasyon}
                                    onChange={(e) => updateField('lokasyon', e.target.value)}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Metrekare *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="m²"
                                        value={form.metrekare}
                                        onChange={(e) => updateField('metrekare', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Oda sayısı</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="3+1"
                                        value={form.odaSayisi}
                                        onChange={(e) => updateField('odaSayisi', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Banyo</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="1"
                                        value={form.banyoSayisi}
                                        onChange={(e) => updateField('banyoSayisi', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Kat</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="3. kat"
                                        value={form.kat}
                                        onChange={(e) => updateField('kat', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Bina yaşı</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="5"
                                        value={form.binaYasi}
                                        onChange={(e) => updateField('binaYasi', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Isınma</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Kombi, merkezi"
                                        value={form.isitma}
                                        onChange={(e) => updateField('isitma', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Kullanım</label>
                                <select
                                    className={styles.formSelect}
                                    value={form.kullanim}
                                    onChange={(e) => updateField('kullanim', e.target.value as 'satilik' | 'kiralik')}
                                >
                                    <option value="satilik">Satılık</option>
                                    <option value="kiralik">Kiralık</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Fiyat (opsiyonel)</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Örn: 5.500.000 TL"
                                    value={form.fiyat}
                                    onChange={(e) => updateField('fiyat', e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ek notlar (opsiyonel)</label>
                                <textarea
                                    className={styles.formTextarea}
                                    placeholder="Öne çıkan özellikler, ulaşım, çevre..."
                                    value={form.ekNotlar}
                                    onChange={(e) => updateField('ekNotlar', e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className={styles.panelTitle}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>Fotoğraf ve zorunlu alanları doldurup <strong>Metni Oluştur</strong> butonuna tıklayın. Yapay zeka bu bilgiler ve görsellerden ilan metnini üretir.</p>
                        </div>
                        <button
                            type="button"
                            className={styles.processBtn}
                            onClick={handleGenerate}
                            disabled={!canSubmit || isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    Metni Oluştur
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
