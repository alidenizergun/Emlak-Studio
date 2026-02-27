export default function manifest() {
    return {
        name: 'Emlak Stüdyosu',
        short_name: 'Emlak Stüdyosu',
        description: 'Yapay zeka ile emlak görselleştirme',
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
