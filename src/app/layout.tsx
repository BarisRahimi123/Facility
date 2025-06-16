import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Optimize font loading
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "facilityCore - Modern Facility Management",
  description: "Streamline your facility operations with facilityCore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="/safari-polyfill.js" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>
          <div className="min-h-screen bg-black">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
