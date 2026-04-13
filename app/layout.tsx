import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/Toast";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Aerial Command - Sistem Pantauan Lalu Lintas",
  description: "Adaptive Traffic Light Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-body antialiased`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
