import ComparisonSlider from '../../components/ComparisonSlider';
import TrialCTA from '../../components/TrialCTA';

const EXAMPLES = [
    {
        id: 1,
        title: "Modern Lüks Salon",
        category: "Salon",
        before: "/images/examples/living-empty.png",
        after: "/images/examples/living-furnished.png"
    },
    {
        id: 2,
        title: "İskandinav Yatak Odası",
        category: "Yatak Odası",
        before: "/images/examples/bedroom-empty.png",
        after: "/images/examples/bedroom-furnished.png"
    },
    {
        id: 3,
        title: "Modern Mutfak",
        category: "Mutfak",
        before: "/images/examples/kitchen-empty.png",
        after: "/images/examples/kitchen-furnished.png"
    },
    {
        id: 4,
        title: "Spa Banyo",
        category: "Banyo",
        before: "/images/examples/bathroom-empty-v3.png",
        after: "/images/examples/bathroom-furnished-v3.png"
    },
    {
        id: 5,
        title: "Ev Ofisi",
        category: "Çalışma Odası",
        before: "/images/examples/office-empty.png",
        after: "/images/examples/office-furnished.png"
    },
    {
        id: 6,
        title: "Lüks Arka Bahçe",
        category: "Bahçe",
        before: "/images/examples/garden-empty.png",
        after: "/images/examples/garden-furnished.png"
    },
    {
        id: 7,
        title: "Çocuk Odası",
        category: "Çocuk Odası",
        before: "/images/examples/kids-empty.png",
        after: "/images/examples/kids-furnished.png"
    },
    {
        id: 8,
        title: "Yemek Odası",
        category: "Yemek Odası",
        before: "/images/examples/dining-empty.png",
        after: "/images/examples/dining-furnished.png"
    },
    {
        id: 9,
        title: "Panoramik Balkon",
        category: "Balkon & Teras",
        before: "/images/examples/balcony-empty.png",
        after: "/images/examples/balcony-furnished.png"
    },
    {
        id: 10,
        title: "Ev Spor Salonu",
        category: "Spor Odası",
        before: "/images/examples/gym-empty.png",
        after: "/images/examples/gym-furnished.png"
    },
    {
        id: 11,
        title: "Giyinme Odası",
        category: "Giyinme Odası",
        before: "/images/examples/closet-empty.png",
        after: "/images/examples/closet-furnished.png"
    },
    {
        id: 12,
        title: "Çatı Katı Lounge",
        category: "Çatı Katı",
        before: "/images/examples/attic-empty.png",
        after: "/images/examples/attic-furnished.png"
    },
    {
        id: 13,
        title: "Çocuk Oyun Odası",
        category: "Oyun Odası",
        before: "/images/examples/playroom-empty.png",
        after: "/images/examples/playroom-furnished.png"
    },
    {
        id: 14,
        title: "Ev Sineması",
        category: "Sinema Odası",
        before: "/images/examples/cinema-empty.png",
        after: "/images/examples/cinema-furnished.png"
    },
    {
        id: 15,
        title: "Modern Çamaşır Odası",
        category: "Çamaşır Odası",
        before: "/images/examples/laundry-empty.png",
        after: "/images/examples/laundry-furnished.png"
    },
    {
        id: 16,
        title: "Klasik Kütüphane",
        category: "Kütüphane",
        before: "/images/examples/library-empty.png",
        after: "/images/examples/library-furnished.png"
    },
    {
        id: 17,
        title: "Misafir Yatak Odası",
        category: "Misafir Odası",
        before: "/images/examples/guest-empty.png",
        after: "/images/examples/guest-furnished.png"
    },
    {
        id: 18,
        title: "Eğlence ve Hobi Alanı",
        category: "Bodrum Kat",
        before: "/images/examples/basement-empty.png",
        after: "/images/examples/basement-furnished.png"
    },
    {
        id: 19,
        title: "Lüks Havuz Başı",
        category: "Havuz & Deck",
        before: "/images/examples/pool-empty.png",
        after: "/images/examples/pool-furnished.png"
    },
    {
        id: 20,
        title: "Kış Bahçesi",
        category: "Sunroom",
        before: "/images/examples/sunroom-empty.png",
        after: "/images/examples/sunroom-furnished.png"
    },
    {
        id: 21,
        title: "Giriş Holü",
        before: "/images/examples/foyer-before.png",
        after: "/images/examples/foyer-after.png",
        category: "Giriş"
    },
    {
        id: 22,
        title: "Çamurluk Odası",
        before: "/images/examples/mudroom-before.png",
        after: "/images/examples/mudroom-after.png",
        category: "Giriş"
    },
    {
        id: 23,
        title: "Kiler",
        before: "/images/examples/pantry-before.png",
        after: "/images/examples/pantry-after.png",
        category: "Mutfak"
    },

    {
        id: 32,
        title: "Ebeveyn Banyosu",
        before: "/images/examples/bathroom-empty.png",
        after: "/images/examples/bathroom-furnished.png",
        category: "Banyo"
    },


];

export const metadata = {
    title: "Örnek Çalışmalar - Emlak AIStudio | Önce & Sonra Görseller",
    description: "Emlak AIStudio'nun yapay zeka teknolojisi ile oluşturulmuş örnek çalışmaları inceleyin. Gerçek emlak fotoğraflarının dönüşümünü görün.",
    alternates: {
        canonical: '/examples',
    },
    openGraph: {
        title: "Örnek Çalışmalar - Emlak AIStudio",
        description: "Yapay zeka ile oluşturulmuş örnek emlak görselleri inceleyin.",
        url: 'https://emlak-aistudio.com/examples',
    },
};

export default function ExamplesPage() {
    return (
        <div style={{ paddingTop: '120px', paddingBottom: '100px' }} className="container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '20px' }}>
                    Dönüşüm Örnekleri
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '700px', margin: '0 auto' }}>
                    Boş ve cansız odaların yapay zeka ile nasıl satışa hazır, büyüleyici yaşam alanlarına dönüştüğünü keşfedin.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '40px'
            }}>
                {/* Categories will be added here later */}
                {EXAMPLES.map((ex) => (
                    <div key={ex.id} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '24px',
                        border: '1px solid var(--card-border)',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ height: '350px', position: 'relative' }}>
                            <ComparisonSlider
                                beforeImage={ex.before}
                                afterImage={ex.after}
                                degradeBefore={true}
                            />
                        </div>
                        <div style={{ padding: '24px', borderTop: '1px solid var(--card-border)' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '5px' }}>{ex.title}</h3>
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(37, 99, 235, 0.1)', padding: '4px 12px', borderRadius: '100px' }}>
                                {ex.category}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <TrialCTA />
        </div>
    );
}
