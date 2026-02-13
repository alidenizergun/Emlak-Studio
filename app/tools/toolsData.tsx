import React from 'react';

export interface Tool {
    id: string;
    title: string;
    description: string;
    href: string;
    status?: string;
    icon: React.ReactNode;
}

export const TOOLS: Tool[] = [
    {
        id: 'enhance',
        title: 'Fotoğraf Geliştirme',
        description: 'Düşük çözünürlüklü, karanlık fotoğrafları 4K kalitesine yükseltin.',
        href: '/enhance',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
        )
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
        href: '/tools/text',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        )
    },
    {
        id: 'sky',
        title: 'Gökyüzü Değiştirme',
        description: 'Bulutlu gökyüzünü güneşli ve masmavi bir gökyüzü ile değiştirin.',
        href: '/tools/sky',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>
        )
    },
    {
        id: 'remove-object',
        title: 'Akıllı Eşya Silme',
        description: 'İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin.',
        href: '/tools/remove-object',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        )
    },
    {
        id: 'renovation',
        title: 'Sanal Tadilat',
        description: 'Duvarları, zeminleri veya mutfakları tamamen yenileyerek potansiyeli gösterin.',
        href: '/tools/renovation',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" /><polygon points="18 2 22 6 12 16 8 16 8 12 18 2" /></svg>
        )
    },
    {
        id: 'floor-plan',
        title: '3B Kat Planı',
        description: 'Fotoğraflardan otomatik olarak ölçülü 2B ve 3B kat planları oluşturun.',
        href: '/tools/floor-plan',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
        )
    },
    {
        id: 'day-to-dusk',
        title: 'Gündüzden Geceye',
        description: 'Gündüz çekilen dış cephe fotoğraflarını etkileyici gün batımı manzaralarına dönüştürün.',
        href: '/tools/day-to-dusk',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 12v-6" /><path d="M12 12l4 4" /><path d="M4.93 19.07l1.41-1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg>
        )
    },
    {
        id: 'video-tour',
        title: 'AI Video Turu',
        description: 'Durağan fotoğrafları hareketli, müzikli ve profesyonel bir video turuna çevirin.',
        href: '/tools/video-tour',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
        )
    },
    {
        id: 'sketch-render',
        title: 'Eskizden Gerçeğe',
        description: 'Mimari çizimleri veya basit eskizleri saniyeler içinde fotorealistik görsellere dönüştürün.',
        href: '/tools/sketch-render',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20" /><path d="M4 22V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" /><path d="M12 18v-4" /><path d="M10 14h4" /></svg>
        )
    },
    {
        id: 'construction',
        title: 'İnşaat Tamamlama',
        description: 'Kaba inşaat halindeki yapıların bitmiş halini potansiyel alıcılara gösterin.',
        href: '/tools/construction',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2" /><path d="M2 14v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4" /><path d="M6 14v-2c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2" /></svg>
        )
    },
    {
        id: 'social-content',
        title: 'Sosyal Medya Kiti',
        description: 'İlanınız için otomatik olarak Instagram Story, ve LinkedIn post tasarımları üretin.',
        href: '/tools/social-content',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
        )
    },
    {
        id: 'valuation',
        title: 'AI Emlak Değerleme',
        description: 'Büyük veri analizi ile mülklerin en doğru piyasa değerini saniyeler içinde hesaplayın.',
        href: '/tools/valuation',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        )
    },
    {
        id: 'roi-calculator',
        title: 'Yatırım Getirisi Analizi',
        description: 'Yatırımcılar için kira getirisi, amortisman süresi ve nakit akışını yapay zeka ile öngörün.',
        href: '/tools/roi-calculator',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        )
    },
    {
        id: 'chatbot',
        title: '7/24 Sanal Asistan',
        description: 'Potansiyel alıcıların sorularını günün her saati yanıtlayan ve randevu oluşturan AI asistan.',
        href: '/tools/chatbot',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
        )
    },
    {
        id: 'voiceover',
        title: 'Video Seslendirme',
        description: 'Sanal turlarınız için profesyonel kalitede, çok dilli yapay zeka seslendirmeleri oluşturun.',
        href: '/tools/voiceover',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
        )
    },
    {
        id: 'panorama',
        title: '360° Tur İyileştirme',
        description: '360 derece panoramik fotoğrafların kalitesini artırın, dikiş izlerini silin ve aydınlatmayı düzeltin.',
        href: '/tools/panorama',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
        )
    },
    {
        id: 'neighborhood',
        title: 'Detaylı Bölge Analizi',
        description: 'Mahalledeki suç oranları, okul kalitesi, gürültü seviyesi ve sosyal olanakları analiz edin.',
        href: '/tools/neighborhood',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        )
    },
    {
        id: 'energy-score',
        title: 'Enerji Verimliliği Puanı',
        description: 'Fotoğraflardan yalıtım, pencere tipi ve güneş alma durumuna göre tahmini enerji puanı çıkarın.',
        href: '/tools/energy-score',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        )
    },
    {
        id: 'competitor',
        title: 'Rakip Fiyat Takibi',
        description: 'Bölgedeki benzer ilanların fiyat değişimlerini ve pazara giriş çıkışlarını anlık izleyin.',
        href: '/tools/competitor',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
        )
    },
    {
        id: 'shoppable',
        title: 'Mobilya Tanıma',
        description: 'Fotoğraftaki mobilyaların markalarını ve fiyatlarını tespit edip satın alma linkleri sunun.',
        href: '/tools/shoppable',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
        )
    },
    {
        id: 'contract-reader',
        title: 'Kira Sözleşmesi Özeti',
        description: 'Uzun ve karmaşık kira sözleşmelerini tarayıp riskli maddeleri saniyeler içinde özetleyin.',
        href: '/tools/contract-reader',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        )
    }
];
