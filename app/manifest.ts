import type { Metadata } from 'next'

export default function manifest() {
    return {
        name: 'Emlak AIStudio',
        short_name: 'Emlak AI',
        description: '	 zeka ile emlak görselleştirme',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563EB',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
