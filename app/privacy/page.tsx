import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';
import { getCurrentLanguage } from '@/lib/server-language';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Gizlilik Politikası',
    description: 'Studio Estate üzerinde hangi verilerin işlendiğini, nasıl saklandığını ve hangi amaçlarla kullanıldığını inceleyin.',
    path: '/privacy',
  });
}

export default async function PrivacyPage() {
  const lang = await getCurrentLanguage();
  const isEnglish = lang === 'en';

  const sections = isEnglish
    ? [
        ['Data we collect', 'We may process account details, uploaded images, support requests, billing context, and product analytics required to operate the service.'],
        ['How we use it', 'We use this data to authenticate users, run requested image operations, improve reliability, provide support, and comply with legal obligations.'],
        ['Storage and retention', 'Uploaded assets and generated results may be stored for history, download access, and service quality monitoring for a limited retention period.'],
        ['Your control', 'You can contact us to ask about stored personal data, operational records, or removal requests when applicable.'],
      ]
    : [
        ['Topladığımız veriler', 'Hesap bilgileri, yüklenen görseller, destek talepleri, ödeme bağlamı ve hizmeti işletmek için gereken ürün analizleri işlenebilir.'],
        ['Kullanım amaçları', 'Bu verileri kullanıcı doğrulama, istenen görsel işlemleri tamamlama, hizmet güvenilirliğini artırma, destek sağlama ve yasal yükümlülükleri yerine getirme amaçlarıyla kullanırız.'],
        ['Saklama ve süre', 'Yüklenen görseller ve üretilen çıktılar; geçmiş, indirme erişimi ve kalite takibi için sınırlı bir saklama süresi boyunca tutulabilir.'],
        ['Kontrol hakkınız', 'Kişisel verileriniz, operasyon kayıtları veya uygun durumlarda silme talepleri hakkında bizimle iletişime geçebilirsiniz.'],
      ];

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '88px', maxWidth: '920px' }}>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', letterSpacing: '-0.04em' }}>
          {isEnglish ? 'Privacy Policy' : 'Gizlilik Politikası'}
        </h1>
        <p style={{ color: '#64748b', lineHeight: 1.8 }}>
          {isEnglish
            ? 'This summary explains how Studio Estate handles data required to deliver the product. It is written as a practical overview and should be read together with any commercial or legal agreements applicable to your account.'
            : 'Bu özet, Studio Estate’in ürünü sunabilmek için gerekli verileri nasıl işlediğini açıklar. Pratik bir genel bakış sunar ve hesabınıza uygulanabilecek ticari veya hukuki metinlerle birlikte değerlendirilmelidir.'}
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
