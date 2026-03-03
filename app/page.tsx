import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ana Sayfa',
  description: 'Emlak Stüdyosu ile emlak görsellerinizi geliştirin, odaları dekore edin ve ilan metni oluşturun.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Testimonials />
    </>
  );
}
