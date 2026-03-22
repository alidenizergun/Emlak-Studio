import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';
import { getCurrentLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Hakkımızda',
    description: 'Studio Estate ekibini, yaklaşımını ve emlak görsellerini iyileştirme vizyonunu keşfedin.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const lang = await getCurrentLanguage();
  const isEnglish = lang === 'en';

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '88px', maxWidth: '980px' }}>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <section style={{ display: 'grid', gap: '1rem' }}>
          <span style={{ color: '#10b981', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            {isEnglish ? 'About Studio Estate' : 'Studio Estate Hakkında'}
          </span>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.02, letterSpacing: '-0.04em' }}>
            {isEnglish
              ? 'We help real-estate visuals make stronger first impressions.'
              : 'Emlak görsellerinin ilk izlenimini daha güçlü hale getiriyoruz.'}
          </h1>
          <p style={{ fontSize: '1.08rem', lineHeight: 1.8, color: '#64748b', maxWidth: '760px' }}>
            {isEnglish
              ? 'Studio Estate brings together photo enhancement, virtual staging, object removal, and renovation previews in one workflow so agents, teams, and developers can present properties more clearly and confidently.'
              : 'Studio Estate; fotoğraf geliştirme, sanal dekorasyon, eşya silme ve tadilat önizleme araçlarını tek akışta bir araya getirerek emlak profesyonellerinin mülkleri daha net ve daha ikna edici şekilde sunmasına yardımcı olur.'}
          </p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            {
              title: isEnglish ? 'Single visual workflow' : 'Tek görsel iş akışı',
              body: isEnglish
                ? 'The same panel can handle staging, cleanup, enhancement, and renovation previews without fragmenting the process.'
                : 'Aynı panel içinde dekorasyon, temizlik, geliştirme ve tadilat önizleme işlemleri tek süreçte yönetilebilir.',
            },
            {
              title: isEnglish ? 'Built for listing speed' : 'İlan hızına odaklı',
              body: isEnglish
                ? 'We design the product around practical publishing speed, not experimental demo flows.'
                : 'Ürünü deneysel demolar için değil, sahadaki ilan hazırlama hızını artırmak için tasarlıyoruz.',
            },
            {
              title: isEnglish ? 'Designed around trust' : 'Güven odaklı yaklaşım',
              body: isEnglish
                ? 'Architectural continuity, cleaner presentation, and realistic outputs matter because buyers notice them immediately.'
                : 'Mimari süreklilik, temiz sunum ve gerçekçi çıktılar önemli çünkü alıcılar bunları ilk bakışta fark eder.',
            },
          ].map((item) => (
            <article
              key={item.title}
              style={{
                border: '1px solid rgba(148,163,184,0.18)',
                borderRadius: '24px',
                padding: '1.4rem',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
                boxShadow: '0 18px 45px -32px rgba(15, 23, 42, 0.28)',
              }}
            >
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>{item.title}</h2>
              <p style={{ color: '#64748b', lineHeight: 1.75 }}>{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
