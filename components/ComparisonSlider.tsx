"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './ComparisonSlider.module.css';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeAlt?: string;
    afterAlt?: string;
    degradeBefore?: boolean;
    onPositionChange?: (position: number) => void;
}

const ComparisonSlider = ({
    beforeImage,
    afterImage,
    beforeAlt = "Boş Oda",
    afterAlt = "Yapay Zeka ile Dekorasyon",
    degradeBefore = false,
    onPositionChange
}: ComparisonSliderProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isResizing || !sliderRef.current) return;

        const sliderRect = sliderRef.current.getBoundingClientRect();
        let clientX;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const newPosition = ((clientX - sliderRect.left) / sliderRect.width) * 100;
        const clampedPosition = Math.min(100, Math.max(0, newPosition));
        setSliderPosition(clampedPosition);

        // Notify parent of position change
        if (onPositionChange) {
            onPositionChange(clampedPosition);
        }
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    return (
        <div
            className={styles.container}
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
        >
            <div className={styles.imageWrapper}>
                <Image
                    src={afterImage}
                    alt={afterAlt}
                    fill
                    quality={100}
                    priority
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                />
            </div>
            <div
                className={styles.imageWrapper}
                style={{
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                    filter: degradeBefore ? 'brightness(0.7) contrast(1.1) sepia(0.2)' : 'none'
                }}
            >
                <Image
                    src={beforeImage}
                    alt={beforeAlt}
                    fill
                    quality={100}
                    priority
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                />
            </div>
            <div
                className={styles.sliderHandle}
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <div className={styles.handleLine} />
                <div className={styles.handleCircle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {/* Left arrow */}
                        <path d="M11 17l-5-5 5-5" />
                        {/* Right arrow */}
                        <path d="M13 7l5 5-5 5" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;
