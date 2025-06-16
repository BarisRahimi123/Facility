'use client';

import { Toaster } from "@/components/ui/toast";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif']
});

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Toaster />
    </div>
  );
} 