import Hero from "@/components/Hero";
import HomeFeatureCards from "@/components/HomeFeatureCards";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Ana Sayfa',
    description: 'Studio Estate ile emlak görsellerinizi geliştirin, odaları dekore edin ve ilan metni oluşturun.',
    path: '/',
  });
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <HomeFeatureCards />
      <Testimonials />
    </>
  );
}
