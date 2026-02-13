'use client';

import { useState, useEffect } from 'react';
import styles from './Testimonials.module.css';
import { TESTIMONIALS } from '@/lib/data/testimonials';

const Testimonials = () => {
    const [visibleTestimonials, setVisibleTestimonials] = useState<typeof TESTIMONIALS>([]);

    useEffect(() => {
        // Randomly select 4 testimonials to display initially
        const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
        setVisibleTestimonials(shuffled.slice(0, 4));

        // Rotate every 8 seconds
        const interval = setInterval(() => {
            const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
            setVisibleTestimonials(shuffled.slice(0, 4));
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className={styles.testimonialsSection}>
            <div className={`container ${styles.testimonialsContainer}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Emlakçılar Ne Diyor?</h2>
                    <p className={styles.subtitle}>
                        Türkiye'nin dört bir yanından {TESTIMONIALS.length}+ emlakçının deneyimleri
                    </p>
                </div>

                <div className={styles.grid}>
                    {visibleTestimonials.map((testimonial, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
                            <p className={styles.text}>"{testimonial.text}"</p>
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
