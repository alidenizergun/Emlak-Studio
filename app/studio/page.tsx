import { Suspense } from 'react';
import StudioClient from './StudioClient';

export const metadata = {
    title: 'Stüdyo - Emlak Stüdyosu',
    description: 'Tüm araçlara tek sayfadan erişin. Fotoğraf geliştirme, dekorasyon, ilan metni ve daha fazlası.',
};

export default function StudioPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>}>
            <StudioClient />
        </Suspense>
    );
}
