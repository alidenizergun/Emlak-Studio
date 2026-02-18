'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './Testimonials.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';

const Testimonials = () => {
    const [visibleTestimonials, setVisibleTestimonials] = useState<typeof TESTIMONIALS>([]);

    useEffect(() => {
        // Randomly select 4 testimonials to display initially (defer to satisfy lint: no sync setState in effect)
        const t = setTimeout(() => {
            const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
            setVisibleTestimonials(shuffled.slice(0, 4));
        }, 0);

        // Rotate every 8 seconds
        const interval = setInterval(() => {
            const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
            setVisibleTestimonials(shuffled.slice(0, 4));
        }, 8000);

        return () => {
            clearTimeout(t);
            clearInterval(interval);
        };
    }, []);

    return (
        <section className={styles.testimonialsSection}>
            <div className={`container ${styles.testimonialsContainer}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Türkiye&apos;nin dört bir yanından emlakçıların deneyimleri
                    </h2>
                </div>

                <div className={styles.grid}>
                    {visibleTestimonials.map((testimonial, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.stars}>
                                {[...Array(5)].map((_, i) => {
                                    const rating = testimonial.rating || 5;
                                    const isHalf = i < rating && i >= Math.floor(rating);
                                    const isFull = i < Math.floor(rating);

                                    return (
                                        <svg
                                            key={i}
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill={isFull ? "currentColor" : isHalf ? "url(#halfStarGradient)" : "none"}
                                            stroke="currentColor"
                                            strokeWidth="0"
                                            className={styles.starIcon}
                                            style={!isFull && !isHalf ? { color: '#e2e8f0' } : {}}
                                        >
                                            <defs>
                                                <linearGradient id="halfStarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="50%" stopColor="currentColor" />
                                                    <stop offset="50%" stopColor="#e2e8f0" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    );
                                })}
                            </div>
                            <p className={styles.text}>&quot;{testimonial.text}&quot;</p>
                            <div className={styles.authorInfo}>
                                <p className={styles.authorName}>{testimonial.author}</p>
                                <p className={styles.authorCompany}>{testimonial.company}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
