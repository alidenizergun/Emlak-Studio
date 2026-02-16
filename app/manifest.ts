export default function manifest() {
    return {
        name: 'Emlak YZ',
        short_name: 'Emlak YZ',
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
