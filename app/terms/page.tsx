import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';
import { getCurrentLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Kullanım Şartları',
    description: 'Studio Estate hizmetine erişim, kullanım sınırları ve hesap sorumluluklarına ilişkin temel şartları inceleyin.',
    path: '/terms',
  });
}

export default async function TermsPage() {
  const lang = await getCurrentLanguage();
  const isEnglish = lang === 'en';

  const sections = isEnglish
    ? [
        ['Service scope', 'Studio Estate provides visual tooling for real-estate workflows. Feature availability, output quality, and access tiers may vary by plan or rollout phase.'],
        ['Account responsibility', 'Users are responsible for protecting login credentials, uploaded content rights, and lawful use of the service.'],
        ['Generated outputs', 'AI-assisted outputs should be reviewed before publication. Users remain responsible for how listing visuals and claims are ultimately presented.'],
        ['Operational changes', 'We may update features, pricing, processing limits, or retention practices as the product evolves.'],
      ]
    : [
        ['Hizmet kapsamı', 'Studio Estate, emlak iş akışları için görsel araçlar sunar. Özellik erişimi, çıktı kalitesi ve kullanım kademeleri pakete veya yayına alma aşamasına göre değişebilir.'],
        ['Hesap sorumluluğu', 'Kullanıcılar giriş bilgilerini korumak, yükledikleri içeriklerin kullanım hakkına sahip olmak ve hizmeti hukuka uygun şekilde kullanmakla sorumludur.'],
        ['Üretilen çıktılar', 'Yapay zeka destekli çıktılar yayın öncesinde kontrol edilmelidir. İlan görsellerinin ve iddiaların nihai kullanım sorumluluğu kullanıcıya aittir.'],
        ['Operasyonel değişiklikler', 'Ürün geliştikçe özellikler, fiyatlandırma, işlem limitleri veya saklama politikaları güncellenebilir.'],
      ];

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '88px', maxWidth: '920px' }}>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', letterSpacing: '-0.04em' }}>
          {isEnglish ? 'Terms of Use' : 'Kullanım Şartları'}
        </h1>
        <p style={{ color: '#64748b', lineHeight: 1.8 }}>
          {isEnglish
            ? 'These terms summarize the general conditions for accessing and using Studio Estate. They are intended to make expectations clear for both product usage and account management.'
            : 'Bu şartlar, Studio Estate’e erişim ve kullanım için geçerli genel çerçeveyi özetler. Hem ürün kullanımı hem de hesap yönetimi açısından beklentileri netleştirmek için hazırlanmıştır.'}
        </p>

        {sections.map(([title, body]) => (
          <section key={title} style={{ padding: '1.35rem 0', borderTop: '1px solid rgba(148,163,184,0.18)' }}>
            <h2 style={{ fontSize: '1.08rem', marginBottom: '0.55rem' }}>{title}</h2>
            <p style={{ color: '#64748b', lineHeight: 1.8 }}>{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
