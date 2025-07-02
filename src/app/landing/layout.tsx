import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FacilityCore - Find Your Perfect Space',
  description: 'Discover and book the perfect facilities and fields for your needs. Search, filter, and reserve spaces with ease.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 