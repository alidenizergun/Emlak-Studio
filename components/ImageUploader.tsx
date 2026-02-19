"use client";

import { useState, useRef } from 'react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
    onImageSelect?: (file: File) => void;
    onImagesSelect?: (files: File[]) => void;
    label?: string;
    subtext?: string;
    multiple?: boolean;
    maxFiles?: number;
    mini?: boolean;
}

const ImageUploader = ({
    onImageSelect,
    onImagesSelect,
    label = "Fotoğraf Yükle",
    subtext,
    multiple = false,
    maxFiles = 5,
    mini = false
}: ImageUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

            if (droppedFiles.length === 0) return;

            if (multiple) {
                if (droppedFiles.length > maxFiles) {
                    alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
                    return;
                }
                onImagesSelect?.(droppedFiles);
            } else {
                onImageSelect?.(droppedFiles[0]);
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            if (multiple) {
                if (selectedFiles.length > maxFiles) {
                    alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
                onImagesSelect?.(selectedFiles);
            } else {
                onImageSelect?.(selectedFiles[0]);
            }
        }
    };

    return (
        <div
            className={`${styles.uploader} ${mini ? styles.mini : ''} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple={multiple}
                className={styles.hiddenInput}
            />
            <div className={styles.content}>
                {!mini && (
                    <div className={styles.icon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                <p className={styles.text} style={mini ? { fontSize: '2rem', margin: 0, color: '#94a3b8' } : {}}>{label}</p>
                {!mini && (
                    <p className={styles.subtext}>
                        {subtext || (multiple ? `veya sürükleyip bırakın (en fazla ${maxFiles} fotoğraf)` : 'veya sürükleyip bırakın')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
