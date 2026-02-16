"use client";

import { useEffect, useState } from 'react';
import styles from './EnhanceResultModal.module.css';
import ComparisonSlider from './ComparisonSlider';

interface EnhanceResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    beforeImage: string;
    afterImage: string;
}

const EnhanceResultModal = ({ isOpen, onClose, beforeImage, afterImage }: EnhanceResultModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(afterImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `enhanced-image-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback for data URLs if fetch fails
            const link = document.createElement('a');
            link.href = afterImage;
            link.download = `enhanced-image-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose} style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s' }}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div className={styles.header}>
                    <div className={styles.title}>
                        Sonuçlarınız Hazır
                        <span className={styles.badge}>4K ULTRA HD</span>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.previewArea}>
                        <ComparisonSlider
                            beforeImage={beforeImage}
                            afterImage={afterImage}
                            beforeAlt="Orijinal"
                            afterAlt="Geliştirilmiş (4K)"
                            preserveAspect={true}
                        />
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={`${styles.button} ${styles.secondaryButton}`} onClick={onClose}>
                        Kapat
                    </button>
                    <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleDownload}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        İndir (4K)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnhanceResultModal;
