import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Örnekler | Emlak Stüdyosu",
    description: "Yapay zeka ile dönüştürülmüş emlak fotoğraflarını inceleyin.",
};

export default function ExamplesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
