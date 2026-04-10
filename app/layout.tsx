import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindTrack",
  description: "AI-Powered Collaborative Study Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MindTrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="env-var-override" strategy="beforeInteractive">
          {`
          window.process = window.process || { };
          window.process.env = window.process.env || { };
          window.process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyA4MGOnuikepIa2KTKWsjXFdibYRa8npPc";
          window.process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "chatapp-83c84.firebaseapp.com";
          window.process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "chatapp-83c84";
          window.process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = "https://chatapp-83c84-default-rtdb.firebaseio.com";
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
