
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'İkon Testi',
    robots: { index: false, follow: false },
};

const ICONS: React.ReactElement<React.SVGProps<SVGSVGElement>>[] = [
    <svg key="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.4 7.2L20 9.2L14.4 11.2L12 16.4L9.6 11.2L4 9.2L9.6 7.2L12 2Z" fill="currentColor" /><path d="M19 15L20.2 17.6L23 18.6L20.2 19.6L19 22.2L17.8 19.6L15 18.6L17.8 17.6L19 15Z" fill="currentColor" /></svg>,
    <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4V2" /><path d="M15 16V14" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8L19 13" /><path d="M10.6 5.2L12 6.4" /><path d="M12.6 18l-6.8-6.6a2.121 2.121 0 0 1 3-3L15.6 15" /><path d="M21 21L15.6 15" /></svg>,
    <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>,
    <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2h5" /><path d="M12 10v-3.5" /><path d="M12 14v8" /><path d="M6 6 L18 6" /><path d="M5 10 L19 10" /><path d="M4 14 L20 14" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" opacity="0.5" /></svg>,
    <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5 5 2 7-7-5-7 5 2-7-5-5h7z" /></svg>,
    <svg key="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    <svg key="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>,
    <svg key="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" /><path d="M15 9l-3 3-3-3" /><path d="M12 15V9" /></svg>,
    <svg key="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z" /><path d="M12 6l4 10H8l4-10z" /></svg>,
    <svg key="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /><path d="M8 8l-2-2" /><path d="M16 8l2-2" /><path d="M8 16l-2 2" /><path d="M16 16l2 2" /></svg>,
    <svg key="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    <svg key="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9S6.1 3.5 4.07 5.53s-.02 7.36 4.5 11.9 9.54 4.8 11.63 2.77z" /><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9s-7.36-.02-11.9 4.5c-4.52 4.54-6.54 9.87-4.5 11.9s7.36.02 11.9-4.5z" /></svg>,
    <svg key="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 8.4L22 12l-7.6 1.6L12 22l-2.4-8.4L2 12l7.6-1.6z" /></svg>,
    <svg key="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M15 14a3 3 0 1 0-6 0" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>,
    <svg key="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>,
    <svg key="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 15c6.667-6 13.333 0 20-6" /><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" /><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" /><path d="M17 6l-2.5-2.5" /><path d="M14 8l-1-1" /><path d="M7 18l2.5 2.5" /><path d="M3.5 14.5l-1 1" /><path d="M22 9c-5.833 5.333-11.667-5.333-17.5 0" /></svg>,
    <svg key="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
    <svg key="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    <svg key="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" /></svg>,
    <svg key="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
];

export default function IconTestPage() {
    return (
        <div style={{ padding: '80px 20px', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0f172a' }}>
                    AI İkon Alternatifleri
                </h1>
                <p style={{ marginBottom: '3rem', color: '#64748b' }}>
                    Aşağıdaki 20 seçenekten beğendiğinizin numarasını seçin.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '24px'
                }}>
                    {ICONS.map((icon, index) => (
                        <div key={index} style={{
                            background: 'white',
                            padding: '30px 20px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                                // animation: 'pulse 2s infinite' // Optional animation preview
                            }}>
                                {React.cloneElement(icon, { width: 48, height: 48 })}
                            </div>
                            <span style={{
                                fontWeight: '700',
                                color: '#64748b',
                                fontSize: '1.2rem'
                            }}>
                                #{index + 1}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
