import AiTourGuideClient from './AiTourGuideClient';

export const metadata = {
    title: 'Yapay Zeka Sunucusu - Emlak YZ',
    description: 'Yapay zeka sunucusu evin içinde gezer, mülk bilgilerini video olarak kullanıcılara aktarır.',
};

export default function AiTourGuidePage() {
    return <AiTourGuideClient />;
}
