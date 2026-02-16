'use client';

import { useState } from 'react';
import styles from './Tools.module.css';

export default function ToolsSuggest() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus('sending');
        try {
            const res = await fetch('/api/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), message: message.trim() }),
            });
            if (res.ok) {
                setStatus('success');
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
        <section className={styles.suggestSection} aria-labelledby="suggest-heading">
            <h2 id="suggest-heading" className={styles.suggestTitle}>Öneride bulunun</h2>
            <p className={styles.suggestDesc}>
                Eksik gördüğünüz bir araç veya iyileştirme fikriniz mi var? E-posta adresinizi bırakın, sizinle iletişime geçelim.
            </p>
            {status === 'success' ? (
                <p className={styles.suggestSuccess}>Teşekkürler! Öneriniz alındı.</p>
            ) : (
                <form onSubmit={handleSubmit} className={styles.suggestForm}>
                    <div className={styles.suggestRow}>
                        <label htmlFor="suggest-email" className={styles.suggestLabel}>E-posta</label>
                        <input
                            id="suggest-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            className={styles.suggestInput}
                            required
                            disabled={status === 'sending'}
                        />
                    </div>
                    <div className={styles.suggestRow}>
                        <label htmlFor="suggest-message" className={styles.suggestLabel}>Öneriniz</label>
                        <textarea
                            id="suggest-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hangi araç veya özelliği ekleyelim?"
                            className={styles.suggestTextarea}
                            rows={3}
                            disabled={status === 'sending'}
                        />
                    </div>
                    {status === 'error' && (
                        <p className={styles.suggestError}>Gönderilemedi. Lütfen tekrar deneyin.</p>
                    )}
                    <button type="submit" className={styles.suggestSubmit} disabled={status === 'sending'}>
                        {status === 'sending' ? 'Gönderiliyor…' : 'Gönder'}
                    </button>
                </form>
            )}
        </section>
    );
}
