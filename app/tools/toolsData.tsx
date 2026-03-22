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
        id: 'stage',
        title: 'Sanal Dekorasyon',
        description: 'Boş odaları Studio Estate ile istediğiniz tarz mobilyalarla döşeyin.',
        href: '/stage',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20V8l8-4 8 4v12" />
                <path d="M4 8h16" />
                <path d="M12 4v16" />
                <path d="M7 12h3" />
                <path d="M14 12h3" />
                <path d="M8 20v-4h8v4" />
            </svg>
        )
    },
    {
        id: 'enhance',
        title: 'Fotoğraf Geliştirme',
        description: 'Düşük çözünürlüklü, karanlık fotoğrafları 4K kalitesine yükseltin.',
        href: '/enhance',
        icon: ENHANCE_ICON,
    },
    {
        id: 'remove-object',
        title: 'Akıllı Eşya Silme',
        description: 'İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin.',
        href: '/remove-object',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        )
    },
    {
        id: 'renovation',
        title: 'Sanal Tadilat',
        description: 'Duvarları, zeminleri veya mutfakları tamamen yenileyerek potansiyeli gösterin.',
        href: '/sanal-tadilat',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" /><polygon points="18 2 22 6 12 16 8 16 8 12 18 2" /></svg>
        )
    },
    {
        id: 'ai-tour-guide',
        title: 'Sanal Sunucu',
        description: 'Sanal sunucu evin içinde gezer, mülk bilgilerini video olarak kullanıcılara aktarır.',
        href: '/ai-tour-guide',
        status: 'Yakında',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /><path d="M6 10h4" /><path d="M6 14h6" /></svg>
        )
    }
];
