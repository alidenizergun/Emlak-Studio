// JSON-LD Structured Data for Emlak AIStudio

export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Emlak AIStudio",
    "url": "https://emlak-aistudio.com",
    "logo": "https://emlak-aistudio.com/logo.png",
    "description": "Emlak ilanlarınızı yapay zeka ile dönüştürün. Boş odaları mobilyalandırın, karanlık fotoğrafları aydınlatın.",
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "destek@emlak-aistudio.com"
    },
    "sameAs": []
};

export const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Emlak AIStudio",
    "url": "https://emlak-aistudio.com",
    "description": "Yapay zeka ile emlak görselleştirme platformu",
    "publisher": {
        "@type": "Organization",
        "name": "Emlak AIStudio"
    }
};

export const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Emlak AIStudio",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY",
        "description": "2 ücretsiz kredi ile başlayın"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "245",
        "bestRating": "5",
        "worstRating": "1"
    },
    "featureList": [
        "Sanal Mobilyalama",
        "Işık İyileştirme",
        "Gökyüzü Değiştirme",
        "HDR Fotoğraf",
        "AI Dekorasyon"
    ]
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `https://emlak-aistudio.com${item.url}`
    }))
});
