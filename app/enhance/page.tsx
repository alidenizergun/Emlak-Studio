import EnhanceClient from "./EnhanceClient";

export const metadata = {
    title: "AI Görsel İyileştirme - Emlak AIStudio | Sanal Mobilyalama",
    description: "Emlak fotoğraflarınızı yapay zeka ile iyileştirin. Sanal mobilyalama, ışık düzeltme, gökyüzü değiştirme ve profesyonel görsel düzenleme araçları.",
    alternates: {
        canonical: '/enhance',
    },
    openGraph: {
        title: "AI Görsel İyileştirme - Emlak AIStudio",
        description: "Emlak fotoğraflarınızı yapay zeka ile iyileştirin.",
        url: 'https://emlak-aistudio.com/enhance',
    },
};

export default function EnhancePage() {
    return <EnhanceClient />;
}
