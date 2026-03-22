'use client';

import { useState } from 'react';
import styles from './Suggestions.module.css';
import { useI18n } from '@/components/LanguageProvider';

export default function SuggestionsClient() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      if (res.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('Öneride Bulunun')}</h1>
        <p className={styles.description}>
          {t('Studio Estate’ı geliştirmemiz için fikirlerinizi bizimle paylaşın. Eksik gördüğünüz bir özellik veya yeni bir araç öneriniz mi var?')}
        </p>
      </div>

      <div className={styles.formContainer}>
        {status === 'success' ? (
          <div className={styles.successMessage}>
            <p>{t('Teşekkürler! Öneriniz başarıyla alındı. En kısa sürede değerlendireceğiz.')}</p>
            <button
              onClick={() => setStatus('idle')}
              className={styles.submitBtn}
              style={{ marginTop: '1rem', width: '100%', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
            >
              {t('Yeni Öneri Gönder')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>{t('Adınız Soyadınız (İsteğe bağlı)')}</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Adınız Soyadınız')}
                className={styles.input}
                disabled={status === 'sending'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>{t('E-posta Adresiniz')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('ornek@email.com')}
                className={styles.input}
                required
                disabled={status === 'sending'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>{t('Öneriniz / Mesajınız')}</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('Hangi araç veya özelliği ekleyelim? Detaylı açıklayabilir misiniz?')}
                className={styles.textarea}
                rows={5}
                required
                disabled={status === 'sending'}
              />
            </div>

            {status === 'error' && (
              <div className={styles.errorMessage}>
                {t('Gönderilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.')}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={status === 'sending'}>
              {status === 'sending' ? t('Gönderiliyor...') : t('Öneriyi Gönder')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
