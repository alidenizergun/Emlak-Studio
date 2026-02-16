import React from 'react';

export interface Tool {
    id: string;
    title: string;
    description: string;
    href: string;
    status?: string;
    icon: React.ReactNode;
}

/** Tek kaynak: hydration uyumu için Header ve TOOLS aynı referansı kullanır */
export const ENHANCE_ICON = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
        <path d="M15 5l2 2 3-3" />
    </svg>
);

export const TOOLS: Tool[] = [
    {
        id: 'enhance',
        title: 'Fotoğraf Geliştirme',
        description: 'Düşük çözünürlüklü, karanlık fotoğrafları 4K kalitesine yükseltin.',
        href: '/enhance',
        icon: ENHANCE_ICON,
    },
    {
        id: 'stage',
        title: 'Sanal Dekorasyon',
        description: 'Boş odaları yapay zeka ile modern mobilyalarla döşeyin.',
        href: '/stage',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        )
    },
    {
        id: 'text',
        title: 'İlan Metni Oluşturucu',
        description: 'Fotoğraflardan otomatik olarak profesyonel ilan açıklamaları yazın.',
        href: '#',
        status: 'Yakında',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        )
    },
    {
        id: 'remove-object',
        title: 'Akıllı Eşya Silme',
        description: 'İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin.',
        href: '#',
        status: 'Yakında',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        )
    },
    {
        id: 'renovation',
        title: 'Sanal Tadilat',
        description: 'Duvarları, zeminleri veya mutfakları tamamen yenileyerek potansiyeli gösterin.',
        href: '#',
        status: 'Yakında',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" /><polygon points="18 2 22 6 12 16 8 16 8 12 18 2" /></svg>
        )
    },
    {
        id: 'ai-tour-guide',
        title: 'Yapay Zeka Sunucusu',
        description: 'Yapay zeka sunucusu evin içinde gezer, mülk bilgilerini video olarak kullanıcılara aktarır.',
        href: '#',
        status: 'Yakında',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /><path d="M6 10h4" /><path d="M6 14h6" /></svg>
        )
    }
];
