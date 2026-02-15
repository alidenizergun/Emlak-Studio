'use client';

import Link from 'next/link';

const stroke = 'white';
const strokeWidth = 1.8;
const cap = 'round';
const join = 'round';

const SLIDER_ICONS = [
  {
    id: 1,
    name: 'Çift ok (mevcut)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <path d="M11 17l-5-5 5-5" />
        <path d="M13 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    id: 2,
    name: 'Tek chevron',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <path d="M15 18l-6-6 6-6" />
        <path d="M9 6l6 6-6 6" />
      </svg>
    ),
  },
  {
    id: 3,
    name: 'Üç dikey çizgi (grip)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <line x1="8" y1="6" x2="8" y2="18" />
        <line x1="12" y1="6" x2="12" y2="18" />
        <line x1="16" y1="6" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    id: 4,
    name: 'Açılı parantez',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <path d="M11 7l-5 5 5 5" />
        <path d="M13 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    id: 5,
    name: 'İki paralel çizgi',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <line x1="9" y1="5" x2="9" y2="19" />
        <line x1="15" y1="5" x2="15" y2="19" />
      </svg>
    ),
  },
  {
    id: 6,
    name: 'İnce ok uçları',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <path d="M10 12H4" />
        <path d="M20 12h-6" />
        <path d="M8 8L4 12l4 4" />
        <path d="M16 8l4 4-4 4" />
      </svg>
    ),
  },
  {
    id: 7,
    name: 'Dört nokta',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <circle cx="8" cy="8" r="1.5" fill={stroke} />
        <circle cx="16" cy="8" r="1.5" fill={stroke} />
        <circle cx="8" cy="16" r="1.5" fill={stroke} />
        <circle cx="16" cy="16" r="1.5" fill={stroke} />
      </svg>
    ),
  },
  {
    id: 8,
    name: 'Yatay üç çizgi',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <line x1="5" y1="8" x2="19" y2="8" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="5" y1="16" x2="19" y2="16" />
      </svg>
    ),
  },
  {
    id: 9,
    name: 'Çift V (sol-sağ)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <path d="M9 8l-3 4 3 4" />
        <path d="M15 8l3 4-3 4" />
      </svg>
    ),
  },
  {
    id: 10,
    name: 'Dikey çizgi + noktalar',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin={join}>
        <line x1="12" y1="4" x2="12" y2="20" />
        <circle cx="12" cy="8" r="1.2" fill={stroke} />
        <circle cx="12" cy="12" r="1.2" fill={stroke} />
        <circle cx="12" cy="16" r="1.2" fill={stroke} />
      </svg>
    ),
  },
];

export default function SliderIconsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#93c5fd', marginBottom: '1.5rem', display: 'inline-block' }}>
          ← Ana sayfa
        </Link>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Slider handle ikon seçimi</h1>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          Aşağıdaki 10 alternatiften birini seçin. Seçtiğiniz numarayı söyleyin, yayına alalım. Hepsi ince beyaz parlak stil.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {SLIDER_ICONS.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  background: 'var(--primary, #2563eb)',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.4)',
                }}
              >
                {item.svg}
              </div>
              <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{item.id}.</strong> {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
