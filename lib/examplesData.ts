export type ExampleItem = {
    id: number;
    title: string;
    category: string;
    categoryId: string;
    before: string;
    after: string
};

export const POPUP_HINT_SENTENCES = [
    'Boş oda fotoğrafı ilanı zayıflatır; dekore görsel satışı hızlandırır.',
    'Profesyonel görsel, daha az pazarlık ve daha yüksek fiyat demek.',
    'Bir tıkla boş oda dolu odaya dönüşüyor; denemesi ücretsiz.',
    'Dikkat çekmeyen ilan zor satılır; bu görseller dikkat çeker.',
    'Müşteri “bu evde yaşarım” hissini dekore fotoğrafla daha çok yaşıyor.',
    'İlan süresini kısaltın: güçlü görsel, daha hızlı satış.',
    'Ücretsiz deneyin; farkı kendi ilanlarınızda görün.',
    'Saniyeler içinde ilan görselinizi rakiplerinizden daha güçlü hale getirin.',
];

export const EXAMPLES: ExampleItem[] = [
    {
        id: 1,
        title: "Modern Lüks Salon",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/living-empty.png",
        after: "/images/examples/living-furnished.png"
    },
    {
        id: 2,
        title: "İskandinav Yatak Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/bedroom-empty.png",
        after: "/images/examples/bedroom-furnished.png"
    },
    {
        id: 3,
        title: "Modern Mutfak",
        category: "Mutfak",
        categoryId: "kitchen",
        before: "/images/examples/kitchen-empty.png",
        after: "/images/examples/kitchen-furnished.png"
    },
    {
        id: 4,
        title: "Spa Banyo",
        category: "Banyo",
        categoryId: "bathroom",
        before: "/images/examples/bathroom-empty-v3.png",
        after: "/images/examples/bathroom-furnished-v3.png"
    },
    {
        id: 5,
        title: "Ev Ofisi",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/office-empty.png",
        after: "/images/examples/office-furnished.png"
    },
    {
        id: 6,
        title: "Lüks Arka Bahçe",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/garden-empty.png",
        after: "/images/examples/garden-furnished.png"
    },
    {
        id: 7,
        title: "Çocuk Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/kids-empty.png",
        after: "/images/examples/kids-furnished.png"
    },
    {
        id: 8,
        title: "Yemek Odası",
        category: "Mutfak & Yemek",
        categoryId: "kitchen",
        before: "/images/examples/dining-empty.png",
        after: "/images/examples/dining-furnished.png"
    },
    {
        id: 9,
        title: "Panoramik Balkon",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/balcony-empty.png",
        after: "/images/examples/balcony-furnished.png"
    },
    {
        id: 10,
        title: "Ev Spor Salonu",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/gym-empty.png",
        after: "/images/examples/gym-furnished.png"
    },
    {
        id: 11,
        title: "Giyinme Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/closet-empty.png",
        after: "/images/examples/closet-furnished.png"
    },
    {
        id: 12,
        title: "Çatı Katı Lounge",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/attic-empty.png",
        after: "/images/examples/attic-furnished.png"
    },
    {
        id: 13,
        title: "Çocuk Oyun Odası",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/playroom-empty.png",
        after: "/images/examples/playroom-furnished.png"
    },
    {
        id: 14,
        title: "Ev Sineması",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/cinema-empty.png",
        after: "/images/examples/cinema-furnished.png"
    },
    {
        id: 15,
        title: "Modern Çamaşır Odası",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/laundry-empty.png",
        after: "/images/examples/laundry-furnished.png"
    },
    {
        id: 16,
        title: "Klasik Kütüphane",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/library-empty.png",
        after: "/images/examples/library-furnished.png"
    },
    {
        id: 17,
        title: "Misafir Yatak Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/guest-empty.png",
        after: "/images/examples/guest-furnished.png"
    },
    {
        id: 18,
        title: "Eğlence ve Hobi Alanı",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/basement-empty.png",
        after: "/images/examples/basement-furnished.png"
    },
    {
        id: 19,
        title: "Lüks Havuz Başı",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/pool-empty.png",
        after: "/images/examples/pool-furnished.png"
    },
    {
        id: 20,
        title: "Kış Bahçesi",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/sunroom-empty.png",
        after: "/images/examples/sunroom-furnished.png"
    },
    {
        id: 21,
        title: "Giriş Holü",
        before: "/images/examples/foyer-before.png",
        after: "/images/examples/foyer-after.png",
        category: "Diğer & Ofis",
        categoryId: "other"
    },
    {
        id: 22,
        title: "Çamurluk Odası",
        before: "/images/examples/mudroom-before.png",
        after: "/images/examples/mudroom-after.png",
        category: "Diğer & Ofis",
        categoryId: "other"
    },
    {
        id: 23,
        title: "Kiler",
        before: "/images/examples/pantry-before.png",
        after: "/images/examples/pantry-after.png",
        category: "Mutfak & Yemek",
        categoryId: "kitchen"
    },
    {
        id: 32,
        title: "Ebeveyn Banyonu",
        before: "/images/examples/bathroom-empty.png",
        after: "/images/examples/bathroom-furnished.png",
        category: "Banyo",
        categoryId: "bathroom"
    },
    {
        id: 33,
        title: "Çalışma Odası",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/study-empty.png",
        after: "/images/examples/study-furnished.png"
    },
    {
        id: 34,
        title: "Teras",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/terrace-empty.png",
        after: "/images/examples/terrace-furnished.png"
    }
];
