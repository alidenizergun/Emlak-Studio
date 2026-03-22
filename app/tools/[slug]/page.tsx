import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TOOLS } from '../toolsData';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';
import { buildLocalizedMetadata } from '@/lib/page-metadata';
import { getCurrentLanguage } from '@/lib/server-language';
import { localizePath } from '@/lib/locale-routing';

export async function generateStaticParams() {
    return TOOLS.filter(t => t.href.startsWith('/tools/')).map((tool) => ({
        slug: tool.id,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const tool = TOOLS.find((t) => t.id === slug && t.href.startsWith('/tools/'));

    if (!tool) {
        return buildLocalizedMetadata({
            title: 'Araç Bulunamadı',
            description: 'İstenen araç bulunamadı.',
            path: `/tools/${slug}`,
            index: false,
        });
    }

    const canonical = `/tools/${tool.id}`;
    const metadata = await buildLocalizedMetadata({
        title: tool.title,
        description: tool.description,
        path: canonical,
        images: [DEFAULT_OG_IMAGE],
    });
    return {
        ...metadata,
        openGraph: {
            ...metadata.openGraph,
            title: `${tool.title} | ${SITE_NAME}`,
            description: tool.description,
            url: absoluteUrl(canonical),
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tool = TOOLS.find((t) => t.id === slug && t.href.startsWith('/tools/'));
    const lang = await getCurrentLanguage();

    if (!tool) {
        notFound();
    }

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <a href={localizePath('/tools', lang)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '30px', fontWeight: 500 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                Tüm Araçlara Dön
            </a>

            <div style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)', padding: '60px', textAlign: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', color: 'var(--primary)' }}>
                    {tool.icon}
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', color: 'var(--foreground)' }}>
                    {tool.title}
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 50px', lineHeight: 1.6 }}>
                    {tool.description} Bu araç şu anda beta aşamasında kullanıma açıktır. Aşağıdaki alana verilerinizi yükleyerek işlem yapabilirsiniz.
                </p>

                <div style={{
                    border: '2px dashed var(--card-border)',
                    borderRadius: '16px',
                    padding: '60px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{ marginBottom: '15px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
                        Dosya Yükle veya Sürükle
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                        PNG, JPG veya PDF (Maks. 50MB)
                    </p>
                </div>

                <button style={{
                    marginTop: '40px',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px var(--primary-glow)'
                }}>
                    İşlemi Başlat
                </button>
            </div>
        </div>
    );
}
